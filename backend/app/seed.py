import datetime
from app.core.db import SessionLocal, Base, engine
from app.core.security import hash_password
from app.models.models import (User, Role, Client, Trainer, ClassType, Schedule, Session as Sess, Subscription)
import uuid

Base.metadata.create_all(bind=engine)
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
t1u = get_or_create_user("trainer1@chs.ru", Role.trainer, "Мария Иванова")
t2u = get_or_create_user("trainer2@chs.ru", Role.trainer, "Алексей Петров")
t1 = db.query(Trainer).filter(Trainer.user_id==t1u.id).first()
if not t1:
    t1 = Trainer(user_id=t1u.id, first_name="Мария", last_name="Иванова", specialization="Йога, стретчинг")
    db.add(t1)
t2 = db.query(Trainer).filter(Trainer.user_id==t2u.id).first()
if not t2:
    t2 = Trainer(user_id=t2u.id, first_name="Алексей", last_name="Петров", specialization="Пилатес, аэро")
    db.add(t2)
db.commit(); db.refresh(t1); db.refresh(t2)

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
trainers=[t1,t2]
for wd in range(5):
    for i,ct in enumerate(cts):
        tr = trainers[i % 2]
        st = dt.time(9 + i, 0)
        en = dt.time(10 + i, 0)
        sch = db.query(Schedule).filter(Schedule.class_type_id==ct.id, Schedule.trainer_id==tr.id, Schedule.weekday==wd, Schedule.start_time==st).first()
        if not sch:
            sch = Schedule(class_type_id=ct.id, trainer_id=tr.id, weekday=wd, start_time=st, end_time=en, capacity=10, cancel_deadline_hours=3)
            db.add(sch)
db.commit()

# generate sessions for current week (monday..sunday)
today = dt.date.today()
monday = today - dt.timedelta(days=today.weekday())
schedules = db.query(Schedule).filter(Schedule.is_active==True).all()
for sch in schedules:
    for d in range(7):
        day = monday + dt.timedelta(days=d)
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