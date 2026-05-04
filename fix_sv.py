import json

data = {
    "extName": {"message": "PrivateLinkSaver", "description": "Extension name"},
    "extDescription": {"message": "Spara och organisera dina lankar privat och sakert med losenordsskydd", "description": "Extension description"},
    "cmdSavePage": {"message": "Spara aktuell sida till bokmarken", "description": "Save current page command"},
    "cmdOpenPopup": {"message": "Oppna PrivateLinkSaver popup", "description": "Open popup command"},
    "cmdQuickSearch": {"message": "Snabbsokning i bokmarken", "description": "Quick search command"},
    "contextSaveLink": {"message": "Spara lank till PrivateLinkSaver", "description": "Context menu save link"},
    "contextSavePage": {"message": "Spara sida till PrivateLinkSaver", "description": "Context menu save page"},
    "notificationSaved": {"message": "Sparad: $title$", "description": "Notification saved", "placeholders": {"title": {"content": "$1", "example": "Page Title"}}},
    "notificationExists": {"message": "Denna sida ar redan sparad!", "description": "Notification already exists"},
    "notificationLoginRequired": {"message": "Vanligen logga in for att spara bokmarken", "description": "Notification login required"},
    "auto_logout_5": {"message": "5 minuter", "description": "Auto logout 5 minuter"},
    "auto_logout_15": {"message": "15 minuter", "description": "Auto logout 15 minuter"},
    "auto_logout_30": {"message": "30 minuter", "description": "Auto logout 30 minuter"},
    "auto_logout_60": {"message": "60 minuter", "description": "Auto logout 60 minuter"},
    "auto_logout_never": {"message": "Aldrig", "description": "Auto logout aldrig"}
}

with open(r"D:\APPS By nRn World\Chrome\PrivateLinkSaver\_locales\sv\messages.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Svenska språkfilen ar fixad!")
