import datetime
from app.core.db import SessionLocal, Base, engine
from app.core.security import hash_password
from app.models.models import (User, Role, Client, Trainer, ClassType, Schedule, Session as Sess, Subscription)
import uuid

Base.metadata.create_all(bind=engine)
# migrate: add segment column if missing
try:
    with engine.connect() as conn:
        conn.execute(__import__("sqlalchemy").text("ALTER TABLE clients ADD COLUMN segment VARCHAR DEFAULT 'new'"))
        conn.commit()
except Exception as e:
    print("migrate segment:", e)
# migrate: make sessions.trainer_id nullable
try:
    with engine.connect() as conn:
        conn.execute(__import__("sqlalchemy").text("ALTER TABLE sessions ALTER COLUMN trainer_id DROP NOT NULL"))
        conn.commit()
except Exception as e:
    print("migrate sessions.trainer_id:", e)
# migrate: add frozen_until column if missing
try:
    with engine.connect() as conn:
        conn.execute(__import__("sqlalchemy").text("ALTER TABLE subscriptions ADD COLUMN frozen_until DATE"))
        conn.commit()
except Exception as e:
    print("migrate frozen_until:", e)
db = SessionLocal()

def get_or_create_user(email, role, name, pw="password123"):
    u = db.query(User).filter(User.email==email).first()
    if u: return u
    u = User(email=email, password_hash=hash_password(pw), role=role, full_name=name)
    db.add(u); db.commit(); db.refresh(u)
    return u

# admin
admin = get_or_create_user("admin@chs.ru", Role.admin, "Администратор ЧС")
# trainers
trainers_data = [
    ("Мария", "Петухова", "trainer1@chs.ru", "Персональный тренер, тренер групповых программ"),
    ("Анна", "Мартынова", "trainer2@chs.ru", "Персональный тренер, тренер групповых программ"),
    ("Виктория", "Батылина", "trainer3@chs.ru", "Персональный тренер, тренер групповых программ"),
    ("Ирина", "Додина", "trainer4@chs.ru", "Персональный тренер, тренер групповых программ"),
]
trainer_objs = []
for fn, ln, email, spec in trainers_data:
    u = get_or_create_user(email, Role.trainer, f"{fn} {ln}")
    t = db.query(Trainer).filter(Trainer.user_id == u.id).first()
    if not t:
        t = Trainer(user_id=u.id, first_name=fn, last_name=ln, specialization=spec)
        db.add(t)
    trainer_objs.append(t)
db.commit()
for t in trainer_objs: db.refresh(t)

# clients
clients_data = [("Иван","Петров","client1@chs.ru"),("Анна","Смирнова","client2@chs.ru"),("Олег","Козлов","client3@chs.ru"),("Елена","Волкова","client4@chs.ru"),("Дмитрий","Соколов","client5@chs.ru")]
client_objs=[]
for fn,ln,email in clients_data:
    u = get_or_create_user(email, Role.client, f"{fn} {ln}")
    c = db.query(Client).filter(Client.user_id==u.id).first()
    if not c:
        c = Client(user_id=u.id, first_name=fn, last_name=ln, email=email, phone="+79990000000", status="active")
        db.add(c)
    client_objs.append(c)
db.commit()
for c in client_objs: db.refresh(c)

# class types
ct_names = [("Йога",60,1800,"#7C9A82"),("Пилатес",55,1900,"#B8A99A"),("Аэро-стретчинг",60,2000,"#6FA37A")]
cts=[]
for name,dur,price,color in ct_names:
    ct = db.query(ClassType).filter(ClassType.name==name).first()
    if not ct:
        ct = ClassType(name=name, duration_min=dur, price_single=price, color=color)
        db.add(ct)
    cts.append(ct)
db.commit()
for c in cts: db.refresh(c)

# schedules: weekday 0-6, create for mon-fri
import datetime as dt
trainers=trainer_objs
for wd in range(5):
    for i,ct in enumerate(cts):
        tr = trainers[i % len(trainers)]
        st = dt.time(9 + i, 0)
        en = dt.time(10 + i, 0)
        sch = db.query(Schedule).filter(Schedule.class_type_id==ct.id, Schedule.trainer_id==tr.id, Schedule.weekday==wd, Schedule.start_time==st).first()
        if not sch:
            sch = Schedule(class_type_id=ct.id, trainer_id=tr.id, weekday=wd, start_time=st, end_time=en, capacity=10, cancel_deadline_hours=3)
            db.add(sch)
db.commit()

# generate sessions for next 4 weeks
today = dt.date.today()
monday = today - dt.timedelta(days=today.weekday())
schedules = db.query(Schedule).filter(Schedule.is_active==True).all()
for week in range(4):
    week_monday = monday + dt.timedelta(weeks=week)
    for sch in schedules:
        for d in range(7):
            day = week_monday + dt.timedelta(days=d)
            if day.weekday() != sch.weekday: continue
            exists = db.query(Sess).filter(Sess.schedule_id==sch.id, Sess.date==day).first()
            if exists: continue
            ct = db.query(ClassType).filter(ClassType.id==sch.class_type_id).first()
            start = dt.datetime.combine(day, sch.start_time)
            end = dt.datetime.combine(day, sch.end_time)
            s = Sess(schedule_id=sch.id, class_type_id=sch.class_type_id, trainer_id=sch.trainer_id, date=day, start_at=start, end_at=end, capacity=sch.capacity)
            db.add(s)
db.commit()

# subscriptions for clients
for c in client_objs:
    sub = db.query(Subscription).filter(Subscription.client_id==c.id).first()
    if not sub:
        sub = Subscription(client_id=c.id, type="package", total_visits=8, used_visits=0,
            valid_from=today, valid_until=today+dt.timedelta(days=30), price=12000, status="active")
        db.add(sub)
db.commit()
print("Seed done")