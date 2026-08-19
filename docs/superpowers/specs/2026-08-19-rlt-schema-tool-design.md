# RLT-Schema — Entwurf

Datum: 2026-08-19

## Zweck

Ein Zeichenwerkzeug fuer raumlufttechnische Anlagen, das per Drag-and-drop bedient
wird, genormte Symbole verwendet, Komponenten mit fachlichen Parametern versieht und
das Ergebnis als Bild, Vektorgrafik oder Projektdatei ausgibt. Hauptplattform ist das
iPad; die App wird ueber GitHub Pages ausgeliefert und laeuft nach dem ersten Laden
vollstaendig offline.

## Normbezug

| Bereich | Regelwerk |
| --- | --- |
| Graphische Symbole Lueftung | DIN EN 12792:2003 |
| Fliessschemata allgemein | DIN EN ISO 10628, DIN EN ISO 14617 |
| Kennzeichnung der Luftarten | DIN EN 16798-3, DIN EN 12792 (AUL/ZUL/ABL/FOL/UML) |
| Filterklassen | DIN EN ISO 16890 (ePM1/ePM2,5/ePM10, Coarse), Schwebstoff DIN EN 1822 |
| MSR- und GA-Symbole | VDI 3814, DIN EN ISO 16484-3 |
| Raumluftqualitaet, Auslegung | DIN EN 16798-1 (IDA 1-4), DIN EN 16798-3 |
| Brandschutzklappen | DIN EN 15650, DIN 18017-3 |

## Funktionsumfang

### Zeichenflaeche
- Unbegrenzte Flaeche mit Raster und Fangfunktion, Ausschnitt verschieb- und zoombar.
- Ein Finger auf leerer Flaeche verschiebt den Ausschnitt, zwei Finger zoomen.
- Ein Finger auf einer Komponente verschiebt diese.
- Apple Pencil oder Auswahlwerkzeug zieht einen Auswahlrahmen.
- Komponenten drehen (90-Grad-Schritte) und spiegeln.
- Strang-Modus: eine Komponente, die nahe an den freien Ausgang einer anderen gezogen
  wird, rastet ein und verbindet sich automatisch.

### Symbolbibliothek
Ueber 80 Symbole in neun Kategorien, jeweils mit definierten Anschlusspunkten und
einem eigenen Parameterschema:

1. Luftbehandlung — Ventilatoren, Filter, Erhitzer, Kuehler, Befeuchter, Tropfenabscheider, Schalldaempfer
2. Waermerueckgewinnung — Platten-, Rotations-, Kreislaufverbund-, Waermerohrsystem
3. Klappen und Brandschutz — Absperr-, Jalousie-, Rueckschlag-, Brandschutz-, Entrauchungsklappe, Volumenstromregler
4. Kanal und Formteile — Bogen, T-Stueck, Reduzierung, Uebergang, Revisionsoeffnung, Flexanschluss, Wetterschutzgitter
5. Luftdurchlaesse — Zuluft-, Abluftdurchlass, Drallauslass, Weitwurfduese, Quellauslass, Schlitzdurchlass, Ueberstroemelement
6. MSR und Sensorik — Temperatur, Feuchte, Druck, Differenzdruck, Volumenstrom, CO2, VOC, Rauchmelder, Regler, Frequenzumrichter
7. Wasser- und Kaeltekreis — Pumpe, Zwei- und Dreiwegeventil, Absperrarmatur, Schmutzfaenger, Ausdehnungsgefaess, Waermezaehler
8. Erzeuger — Kessel, Waermepumpe, Kaeltemaschine, Rueckkuehlwerk, Fernwaermeuebergabe
9. Raeume und Beschriftung — Nutzungseinheit, Aussenluftfassung, Fortluftausblasung, Text, Rahmen, Schnittstelle

### Nutzungseinheit
Eigener Symboltyp, der den versorgten Raum darstellt. Parameter: Bezeichnung,
Nutzungsart (Buero, Halle, Werkstatt, Labor, OP, Kueche, Serverraum, Klassenraum,
Versammlungsraum, Lager, Sanitaerraum, Wohnung), Grundflaeche, lichte Hoehe, Volumen
(berechnet), Personenzahl, Zuluft- und Abluftvolumenstrom, Luftwechselrate
(berechnet), Sollwerte fuer Temperatur und relative Feuchte, Druckhaltung (Ueber-,
Unter-, Gleichdruck), Raumluftqualitaetsklasse nach DIN EN 16798-1, zulaessiger
Schalldruckpegel, Reinraum- oder Schutzklasse. Groesse frei skalierbar; andere
Komponenten koennen darin platziert werden.

### Kanaele und Leitungen
- Verbindung entsteht durch Ziehen von einem Anschlusspunkt zum naechsten.
- Orthogonale Fuehrung, automatische Neuberechnung beim Verschieben, verschiebbarer
  Mittelknick.
- Leitungsarten: Luftkanal, Wasser-/Kaelteleitung, Signalleitung (gestrichelt).
- Luftart je Kanal mit Farbcode: Aussenluft gruen, Zuluft blau, Abluft gelb,
  Fortluft braun, Umluft orange, Mischluft grau. Umschaltbar auf einfarbig Schwarz.
- Kanalparameter: Volumenstrom, Abmessung, Geschwindigkeit (berechnet), Daemmung,
  Werkstoff, Dichtheitsklasse.

### Parameter und Beschriftung
- Automatische Betriebsmittelkennzeichen je Typ (VENT-01, FIL-02, RAUM-03 ...),
  fortlaufend, beim Loeschen nicht neu vergeben.
- Typgerechte Felder mit Einheit, Auswahllisten und Standardwerten.
- Je Feld ein Schalter, ob der Wert als Beschriftung am Symbol erscheint.
- Berechnete Felder (Volumen, Luftwechsel, Kanalgeschwindigkeit) sind schreibgeschuetzt.

### Stueckliste
Einblendbare Tabelle aller Komponenten mit Kennzeichen, Typ und gepflegten Parametern,
gruppiert nach Kategorie, live aktualisiert. Optional als Block unter dem Schema im
Export sowie als CSV.

### Projekte und Speicherung
Projekte liegen in IndexedDB: Name, Anlagenkennung, Bearbeiter, Datum, Vorschaubild.
Auto-Speichern nach jeder Aenderung mit Verzoegerung. Anlegen, oeffnen, umbenennen,
duplizieren, loeschen.

### Export
- PNG in ein-, zwei- oder dreifacher Aufloesung.
- SVG als Vektor.
- Projekt-JSON zum Weitergeben, mit Import zurueck ins Tool.
- CSV der Stueckliste.
- Optionaler Schriftkopf mit Projektname, Anlage, Bearbeiter, Datum, Massstabshinweis.
- Ausgabe ueber den Teilen-Dialog des Systems, sonst als Download.

### App auf dem iPad
Manifest und Service Worker, alle Symbole als Programmcode im Bundle, keine externen
Schriften. Start vom Homescreen im Vollbild, Beruecksichtigung der sicheren Bereiche,
keine Ueberrollbewegung, Bedienelemente mindestens 44 Punkt gross.

## Architektur

```
src/
  catalog/   Symbolkatalog: Geometrie, Anschlusspunkte, Parameterschema (Daten, kein UI)
  state/     Dokumentmodell, Zustandsverwaltung, Kennzeichenvergabe, Rueckgaengig
  canvas/    Zeichenflaeche, Symboldarstellung, Kanalfuehrung, Gesten
  ui/        Werkzeugleiste, Palette, Eigenschaften, Stueckliste, Projekte, Export
  export/    SVG-Erzeugung, PNG, CSV, JSON
  storage/   IndexedDB
```

Kernentscheidung: Die Symbolkomponenten aus `catalog` werden sowohl von der
Zeichenflaeche als auch vom SVG-Export gerendert. Ein Symbol ist damit einmal
definiert und kann zwischen Anzeige und Ausgabe nicht auseinanderlaufen.

Die Zustandsverwaltung haelt Knoten, Kanten und Auswahl. Waehrend einer Ziehbewegung
laufen Positionsaenderungen ueber einen fluechtigen Zweig des Zustands, der erst beim
Loslassen in die Historie geschrieben wird; so bleibt die Rueckgaengig-Funktion
schrittweise und die Bildrate hoch.

## Tests

Automatisiert geprueft werden die logischen Teile: Kanalfuehrung, Kennzeichenvergabe,
Parameterberechnungen, Stuecklistenaufbau, Speichern und Laden, JSON-Import mit
fehlerhaften Daten sowie die Vollstaendigkeit des Symbolkatalogs (jedes Symbol hat
Anschlusspunkte, Parameterschema und Zeichenfunktion).

## Nicht enthalten

Mehrbenutzerbearbeitung, Cloud-Konto, Auslegungsrechnung, DXF- oder DWG-Export,
Gewerke ausserhalb der Raumlufttechnik und ihrer unmittelbaren Anbindung.
