# Goedkeuringsworkflow (kort overzicht)

Dit document beschrijft kort hoe het indienen van een TRA met een goedkeuringsverzoek werkt voor eindgebruikers.

1. Indienen met goedkeuring
   - Wanneer u een TRA indient in de TRA-wizard, kunt u kiezen om een goedkeuringsverzoek aan te maken door de optie "Aanvraag goedkeuring" aan te vinken (in de API: veld `createApproval: true`).
   - Als u deze optie kiest wordt er een goedkeuringsrecord aangemaakt en gekoppeld aan de TRA. De TRA-status verandert naar "in_review".

2. Wat betekent "in_review"
   - De TRA is ingediend en wacht op actie van de aangewezen beoordelaars (bijv. safety manager).
   - Beoordelaars ontvangen een melding in het systeem (placeholder notificatie) en kunnen de TRA goedkeuren of afwijzen in hun beoordelaarsinterface.

3. Volgende stappen na beoordeling
   - Bij goedkeuring: de TRA wordt gemarkeerd als goedgekeurd en u ontvangt een bevestiging.
   - Bij afwijzing: de TRA krijgt een "rejected" status en kan worden herzien en opnieuw ingediend.

4. Opmerkingen voor gebruikers
   - Alle zichtbare berichten en meldingen in de applicatie zijn in het Nederlands.
   - E-mail- en push-notificaties zijn voorlopig placeholders; integratie volgt in een latere taak.

5. Voor admins
   - Admins kunnen de goedkeuringsconfiguratie aanpassen via de Admin → Goedkeuringen instellingen.
   - Audit logs worden bijgehouden voor alle submit- en notificatie-acties.
