# Gebruikersgids: Templates in de TRA-wizard

## Overzicht
Met de Template Selector kun je snel starten met een voorgedefinieerde TRA (Task Risk Analysis). Een template kan de titel, beschrijving en taakstappen (met bijbehorende gevaren) vooraf invullen zodat je sneller klaar bent.

## Waar vind je het
- Open "Maak TRA" in de applicatie.
- Stap 0 (Basisinformatie) bevat de Template Selector bovenaan de formuliervelden.

## Stappen om een template te gebruiken
1. Zoek of blader door beschikbare templates met de zoekbalk en categoriefilters.
2. Klik een template om deze te selecteren. Er verschijnt een laadindicator terwijl het template geladen wordt.
3. Het formulier vult automatisch de titel, omschrijving en taakstappen in (voorgesteld). Je kunt elk veld aanpassen.
4. Als je liever helemaal zelf begint, kies "Begin zonder template".
5. Ga verder met de wizard en voltooi de TRA zoals gebruikelijk.

## Tips
- Templates zijn optioneel — je kunt altijd zonder template beginnen.
- Als het laden van templates mislukt, proberen we automatisch een lokaal (bundled) template als fallback te gebruiken.
- De geselecteerde templateId wordt bewaard in het TRA (veld: templateId) zodat herkomst traceerbaar is.

## Veelgestelde vragen
- Q: Worden voorgestelde velden geblokkeerd?  
  A: Nee — ingevulde velden zijn suggesties; je kunt alles bewerken voordat je de TRA opslaat.
- Q: Kan ik terugkeren naar de oorspronkelijke templateversie nadat ik wijzigingen heb aangebracht?  
  A: Niet via een automatische knop. Een "Reset to template" functie staat op de roadmap.
- Q: Hoe weet ik dat iets uit een template komt?  
  A: Er is een korte indicator naast Basisinformatie die aangeeft dat er een template is geselecteerd en welke naam het heeft.

## Bekende beperkingen
- Er is momenteel geen visuele markering per veld die aangeeft dat het uit het template komt (globale indicator alleen).
- Geen "Reset to template" of versie-vergelijking geïntegreerd.
- Screenshots en stap-voor-stap afbeeldingen ontbreken in deze gids; voeg toe bij release.

## Contact / Support
Voor vragen of issues met templates, open een ticket of contacteer het development team (zie git blame op [`web/src/components/templates/TemplateSelector.tsx`](web/src/components/templates/TemplateSelector.tsx:1) en [`web/src/components/forms/TraWizard.tsx`](web/src/components/forms/TraWizard.tsx:1)).

Einde gids.