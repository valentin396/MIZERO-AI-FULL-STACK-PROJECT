"""Populates a demo user, an admin account, and a realistic set of
sample reports spanning all five provinces. Run with: python seed.py
"""
from datetime import date
from app.database import SessionLocal, Base, engine
from app.models import User, Item
from app.auth.jwt import hash_password
from app.matching.text import build_search_text

Base.metadata.create_all(bind=engine)

SAMPLES = [
    dict(status="LOST", category="ID Card", title="National ID lost near Nyabugogo",
         description="Green Rwandan national ID card, name starts with Uwase, was in a small black pouch.",
         location="Nyarugenge", landmark="Nyabugogo bus park", event_date=date(2026, 8, 28)),
    dict(status="FOUND", category="ID Card", title="Found a national ID at Nyabugogo",
         description="Picked up a green ID card near the bus park, belongs to someone named Uwase.",
         location="Nyarugenge", landmark="Nyabugogo bus park", event_date=date(2026, 8, 28)),
    dict(status="LOST", category="Phone", title="Black iPhone 13 lost in Kimironko market",
         description="Black iPhone 13 with a cracked corner, cover has a small flag sticker.",
         location="Gasabo", landmark="Kimironko", event_date=date(2026, 8, 30)),
    dict(status="FOUND", category="Phone", title="Black iPhone found near Kimironko stalls",
         description="A black iPhone with a cracked screen corner, handed to me by a vendor.",
         location="Gasabo", landmark="Kimironko", event_date=date(2026, 8, 30)),
    dict(status="FOUND", category="Bag", title="Blue backpack found at Kigali Convention Centre",
         description="Blue backpack with a laptop and notebooks inside, found on a bench.",
         location="Gasabo", landmark="Kimihurura", event_date=date(2026, 8, 29)),
    dict(status="LOST", category="Laptop", title="HP laptop left at a conference in Kimihurura",
         description="Silver HP laptop in a blue backpack, left under a chair during a tech conference.",
         location="Gasabo", landmark="Kimihurura", event_date=date(2026, 8, 29)),
    dict(status="LOST", category="Wallet", title="Wallet lost during the match at Amahoro Stadium",
         description="Brown wallet with a Bank of Kigali card, dropped near the stadium entrance.",
         location="Gasabo", landmark="Remera, Amahoro Stadium", event_date=date(2026, 8, 22)),
    dict(status="FOUND", category="Keys", title="Car keys found outside Amahoro Stadium",
         description="A single car key with a Toyota fob, found in the parking area.",
         location="Gasabo", landmark="Remera, Amahoro Stadium", event_date=date(2026, 8, 22)),
    dict(status="LOST", category="Document", title="Marriage certificate lost after Sunday service",
         description="A folder with a marriage certificate and two passport photos, left after church.",
         location="Nyarugenge", landmark="Nyamirambo", event_date=date(2026, 8, 24)),
    dict(status="FOUND", category="Document", title="Folder with certificate found near a church",
         description="Found a folder containing what looks like a marriage certificate.",
         location="Nyarugenge", landmark="Nyamirambo", event_date=date(2026, 8, 24)),
    dict(status="LOST", category="Other", title="Work gloves and a hand hoe lost during Umuganda",
         description="Left gloves and a small hoe near the cleanup site during Saturday Umuganda.",
         location="Kicukiro", landmark="Gikondo", event_date=date(2026, 8, 30)),
    dict(status="LOST", category="Wallet", title="Brown leather wallet lost near Musanze taxi park",
         description="Brown leather wallet with a driving license and some cash.",
         location="Musanze", landmark="Taxi park", event_date=date(2026, 8, 25)),
    dict(status="FOUND", category="Document", title="School report card found in Huye",
         description="A student report card found near the university campus, surname Niyonzima.",
         location="Huye", landmark="Near the university campus", event_date=date(2026, 8, 27)),
    dict(status="LOST", category="Phone", title="Samsung phone lost at Nyanza market day",
         description="A Samsung Galaxy in a green case, lost during Saturday market day.",
         location="Nyanza", landmark="Main market", event_date=date(2026, 8, 23)),
    dict(status="FOUND", category="Bag", title="Woven bag found near Gisagara church",
         description="A traditional woven bag with some farming tools inside.",
         location="Gisagara", landmark="Church compound", event_date=date(2026, 8, 20)),
    dict(status="LOST", category="Keys", title="Bunch of house keys lost in Rubavu",
         description="A set of 4 keys on a red keyring with a wooden keychain, near the lake shore.",
         location="Rubavu", landmark="Lake Kivu shore", event_date=date(2026, 8, 31)),
    dict(status="FOUND", category="ID Card", title="ID card found near Rubavu beach",
         description="Found a national ID card on the sand near the public beach, surname Nkurunziza.",
         location="Rubavu", landmark="Lake Kivu shore", event_date=date(2026, 8, 31)),
    dict(status="LOST", category="Bag", title="Sports bag lost after a match in Karongi",
         description="A red and black gym bag with football boots, left near the pitch.",
         location="Karongi", landmark="Community football pitch", event_date=date(2026, 8, 26)),
    dict(status="LOST", category="Phone", title="Tecno phone lost near Musanze park office",
         description="A blue Tecno Spark phone, lost while arranging a gorilla trekking permit.",
         location="Musanze", landmark="Volcanoes National Park office", event_date=date(2026, 8, 21)),
    dict(status="FOUND", category="Wallet", title="Small purse found near Gicumbi trading center",
         description="A small purse with cash and a mobile money card.",
         location="Gicumbi", landmark="Trading center", event_date=date(2026, 8, 18)),
    dict(status="LOST", category="ID Card", title="National ID lost at Rwamagana market",
         description="Lost during the weekly market, surname Mukamana.",
         location="Rwamagana", landmark="Weekly market", event_date=date(2026, 8, 16)),
    dict(status="FOUND", category="Phone", title="Phone found near Nyagatare cattle market",
         description="A small Nokia phone found near the cattle market grounds.",
         location="Nyagatare", landmark="Cattle market", event_date=date(2026, 8, 15)),
    dict(status="LOST", category="Bag", title="School bag lost near Kayonza bus stage",
         description="A grey school bag with textbooks and a calculator.",
         location="Kayonza", landmark="Bus stage", event_date=date(2026, 8, 14)),
    dict(status="FOUND", category="Keys", title="Motorbike key found in Ngoma",
         description="A single motorbike ignition key on a leather strap.",
         location="Ngoma", landmark="Moto stage", event_date=date(2026, 8, 13)),
]


def run():
    db = SessionLocal()
    try:
        demo = db.query(User).filter(User.email == "demo@mizero.rw").first()
        if not demo:
            demo = User(name="Demo Reporter", email="demo@mizero.rw", phone="0788000000",
                        password_hash=hash_password("demo1234"), role="user")
            db.add(demo)
            db.commit()
            db.refresh(demo)

        admin = db.query(User).filter(User.email == "admin@mizero.rw").first()
        if not admin:
            admin = User(name="Admin", email="admin@mizero.rw", phone="0788000001",
                        password_hash=hash_password("admin1234"), role="admin")
            db.add(admin)
            db.commit()

        for s in SAMPLES:
            search_text = build_search_text(s["title"], s["description"], s["category"], s["location"], s["landmark"])
            db.add(Item(
                user_id=demo.id, status=s["status"], category=s["category"],
                title=s["title"], description=s["description"],
                location=s["location"], landmark=s["landmark"],
                event_date=s["event_date"], search_text=search_text,
            ))
        db.commit()

        _seed_matches(db)

        print(f"Seeded {len(SAMPLES)} reports. Demo login: demo@mizero.rw / demo1234. "
              f"Admin login: admin@mizero.rw / admin1234.")
    finally:
        db.close()


def _seed_matches(db):
    from app.models import Item, Match
    from app.matching.engine import compute_matches

    items = db.query(Item).filter(Item.status.in_(["LOST", "FOUND"])).all()
    item_dicts = [{
        "id": it.id, "status": it.status, "category": it.category,
        "location": it.location, "event_date": it.event_date,
        "search_text": it.search_text, "image_hash": it.image_hash,
    } for it in items]
    results = compute_matches(item_dicts)
    for r in results:
        existing = db.query(Match).filter(
            Match.lost_item_id == r["lost_item_id"], Match.found_item_id == r["found_item_id"]
        ).first()
        if not existing:
            db.add(Match(**r))
    db.commit()
    print(f"Computed {len(results)} candidate matches.")


if __name__ == "__main__":
    run()
