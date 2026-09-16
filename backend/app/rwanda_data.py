# Rwanda's real 5 provinces / 30 districts, with sector lists for
# Kigali City's three districts and approximate district-centroid
# coordinates for the map.

DISTRICTS = [
    {"name": "Gasabo", "province": "Kigali City", "lat": -1.9346, "lng": 30.1105,
     "sectors": ["Bumbogo", "Gatsata", "Gikomero", "Gisozi", "Jabana", "Jali",
                 "Kacyiru", "Kimihurura", "Kimironko", "Kinyinya", "Ndera",
                 "Nduba", "Remera", "Rusororo", "Rutunga"]},
    {"name": "Kicukiro", "province": "Kigali City", "lat": -1.9946, "lng": 30.1044,
     "sectors": ["Gahanga", "Gatenga", "Gikondo", "Kagarama", "Kanombe",
                 "Kicukiro", "Kigarama", "Masaka", "Niboye", "Nyarugunga"]},
    {"name": "Nyarugenge", "province": "Kigali City", "lat": -1.9536, "lng": 30.0605,
     "sectors": ["Gitega", "Kanyinya", "Kigali", "Kimisagara", "Mageragere",
                 "Muhima", "Nyakabanda", "Nyamirambo", "Nyarugenge", "Rwezamenyo"]},
    {"name": "Gisagara", "province": "Southern", "lat": -2.5747, "lng": 29.8272},
    {"name": "Huye", "province": "Southern", "lat": -2.5967, "lng": 29.7407},
    {"name": "Kamonyi", "province": "Southern", "lat": -2.0167, "lng": 29.7500},
    {"name": "Muhanga", "province": "Southern", "lat": -2.0844, "lng": 29.7566},
    {"name": "Nyamagabe", "province": "Southern", "lat": -2.4508, "lng": 29.4842},
    {"name": "Nyanza", "province": "Southern", "lat": -2.3500, "lng": 29.7500},
    {"name": "Nyaruguru", "province": "Southern", "lat": -2.6167, "lng": 29.5667},
    {"name": "Ruhango", "province": "Southern", "lat": -2.2167, "lng": 29.7833},
    {"name": "Karongi", "province": "Western", "lat": -2.0667, "lng": 29.3833},
    {"name": "Ngororero", "province": "Western", "lat": -1.8833, "lng": 29.5667},
    {"name": "Nyabihu", "province": "Western", "lat": -1.6500, "lng": 29.5000},
    {"name": "Nyamasheke", "province": "Western", "lat": -2.3500, "lng": 29.1167},
    {"name": "Rubavu", "province": "Western", "lat": -1.6786, "lng": 29.2664},
    {"name": "Rusizi", "province": "Western", "lat": -2.4846, "lng": 28.9075},
    {"name": "Rutsiro", "province": "Western", "lat": -1.8500, "lng": 29.3333},
    {"name": "Burera", "province": "Northern", "lat": -1.4667, "lng": 29.8667},
    {"name": "Gakenke", "province": "Northern", "lat": -1.6833, "lng": 29.7833},
    {"name": "Gicumbi", "province": "Northern", "lat": -1.5667, "lng": 30.0500},
    {"name": "Musanze", "province": "Northern", "lat": -1.4995, "lng": 29.6336},
    {"name": "Rulindo", "province": "Northern", "lat": -1.7667, "lng": 30.0000},
    {"name": "Bugesera", "province": "Eastern", "lat": -2.2167, "lng": 30.2500},
    {"name": "Gatsibo", "province": "Eastern", "lat": -1.5833, "lng": 30.4667},
    {"name": "Kayonza", "province": "Eastern", "lat": -1.8833, "lng": 30.6167},
    {"name": "Kirehe", "province": "Eastern", "lat": -2.2667, "lng": 30.7833},
    {"name": "Ngoma", "province": "Eastern", "lat": -2.1667, "lng": 30.5333},
    {"name": "Nyagatare", "province": "Eastern", "lat": -1.2967, "lng": 30.3267},
    {"name": "Rwamagana", "province": "Eastern", "lat": -1.9489, "lng": 30.4347},
]

CATEGORIES = [
    # Electronics
    "Smartphone", "Laptop", "Tablet", "Earphones", "Smartwatch",
    # Documents
    "National ID", "Passport", "Driving License", "Student ID", "Bank Card",
    # Personal items
    "Backpack", "Wallet", "Keys", "Clothes", "Jewelry",
    # Other
    "Other",
]


def district_names() -> list[str]:
    return [d["name"] for d in DISTRICTS]


def sectors_for(district_name: str) -> list[str]:
    for d in DISTRICTS:
        if d["name"] == district_name:
            return d.get("sectors", [])
    return []


def coords_for(district_name: str) -> tuple[float, float]:
    for d in DISTRICTS:
        if d["name"] == district_name:
            return d["lat"], d["lng"]
    return -1.9403, 29.8739  # fallback: Rwanda's center
