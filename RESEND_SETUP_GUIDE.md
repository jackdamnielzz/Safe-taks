# Resend.com Setup Guide voor SafeWork Pro

**Datum**: 2025-10-03  
**Email Provider**: Resend.com  
**Domain**: maasiso.nl  
**From Address**: noreply@maasiso.nl

---

## Waarom Resend.com?

✅ **Perfect voor jouw situatie:**
- Ondersteunt custom domain (maasiso.nl)
- Gratis tier: 3,000 emails/maand (voldoende voor development + early production)
- Gebouwd voor Next.js/Vercel (jouw exacte stack)
- Uitstekende deliverability
- Eenvoudige setup (2 uur totaal)

✅ **Voordelen vs SendGrid:**
- Goedkoper (gratis vs €15/maand)
- Betere developer experience
- Native Next.js integratie
- Moderne API

---

## Stap 1: Resend Account Aanmaken (5 minuten)

1. Ga naar **https://resend.com**
2. Klik op "Sign Up"
3. Maak account aan met je email
4. Verifieer je email adres

---

## Stap 2: Domain Verificatie (15 minuten)

### 2.1 Domain Toevoegen in Resend

1. Log in op Resend dashboard
2. Ga naar **Domains** in het menu
3. Klik op **Add Domain**
4. Voer in: `maasiso.nl`
5. Klik op **Add**

### 2.2 DNS Records Configureren

Resend geeft je 3 DNS records die je moet toevoegen aan je domain (bij je domain provider):

**SPF Record:**
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
```

**DKIM Record:**
```
Type: TXT
Name: resend._domainkey
Value: [Resend geeft je de exacte waarde]
```

**DMARC Record (optioneel maar aanbevolen):**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@maasiso.nl
```

### 2.3 Verificatie Controleren

1. Wacht 5-10 minuten na het toevoegen van DNS records
2. Klik in Resend op **Verify Domain**
3. Als verificatie slaagt, zie je een groen vinkje ✅

---

## Stap 3: API Key Genereren (2 minuten)

1. Ga naar **API Keys** in Resend dashboard
2. Klik op **Create API Key**
3. Geef een naam: "SafeWork Pro Production"
4. Selecteer permissions: **Full Access** (of **Sending Access** voor productie)
5. Kopieer de API key (begint met `re_...`)

⚠️ **BELANGRIJK**: Bewaar deze key veilig - je kunt hem maar 1x zien!

---

## Stap 4: Environment Variables Configureren (2 minuten)

### 4.1 Lokale Development (.env.local)

De file `web/.env.local` is al voorbereid. Voeg alleen je Resend API key toe:

```bash
# Resend Email Configuration
RESEND_API_KEY=re_jouw_api_key_hier  # ← Vervang met je echte API key
RESEND_FROM_EMAIL=noreply@maasiso.nl
RESEND_FROM_NAME=SafeWork Pro
```

### 4.2 Vercel Production

1. Ga naar je Vercel project dashboard
2. Ga naar **Settings** → **Environment Variables**
3. Voeg toe:
   - `RESEND_API_KEY` = `re_jouw_api_key`
   - `RESEND_FROM_EMAIL` = `noreply@maasiso.nl`
   - `RESEND_FROM_NAME` = `SafeWork Pro`
4. Selecteer **Production**, **Preview**, en **Development**
5. Klik **Save**

---

## Stap 5: Test Email Verzenden (5 minuten)

### 5.1 Via API Route

Test de email functionaliteit met curl of Postman:

```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "welcome",
    "to": "jouw-email@example.com",
    "data": {
      "userName": "Test Gebruiker",
      "organizationName": "Test Organisatie"
    }
  }'
```

### 5.2 Verwachte Response

```json
{
  "success": true,
  "messageId": "abc123..."
}
```

### 5.3 Check Email

- Controleer je inbox
- Check ook spam folder (eerste keer)
- Email moet komen van: SafeWork Pro <noreply@maasiso.nl>

---

## Stap 6: Productie Checklist

Voordat je live gaat:

- [ ] Domain geverifieerd in Resend (groen vinkje)
- [ ] SPF, DKIM, DMARC records geconfigureerd
- [ ] API key toegevoegd aan Vercel environment variables
- [ ] Test email succesvol verzonden
- [ ] Alle 14 email templates getest
- [ ] Email deliverability gecontroleerd (niet in spam)

---

## Email Templates Beschikbaar

De volgende 14 email types zijn geïmplementeerd:

1. **welcome** - Welkom email voor nieuwe gebruikers
2. **invitation** - Team uitnodiging
3. **tra_created** - TRA aangemaakt notificatie
4. **tra_approved** - TRA goedgekeurd
5. **tra_rejected** - TRA afgekeurd
6. **lmra_stop_work** - 🚨 Stop werk alert (CRITICAL)
7. **lmra_completed** - LMRA voltooid
8. **password_reset** - Wachtwoord reset
9. **subscription_created** - Abonnement geactiveerd
10. **subscription_cancelled** - Abonnement opgezegd
11. **payment_failed** - Betaling mislukt
12. **trial_ending** - Proefperiode eindigt
13. **usage_limit_warning** - Gebruikslimiet waarschuwing

---

## Monitoring & Analytics

### Resend Dashboard

Bekijk in het Resend dashboard:
- **Emails** - Alle verzonden emails
- **Analytics** - Open rates, click rates, bounces
- **Logs** - Delivery status per email
- **Webhooks** - Event notifications (optioneel)

### Email Deliverability Tips

1. **Warm-up Period**: Begin met kleine volumes (50-100/dag)
2. **Monitor Bounces**: Verwijder ongeldige email adressen
3. **Engagement**: Hoge open rates verbeteren deliverability
4. **Spam Complaints**: Houd onder 0.1%

---

## Troubleshooting

### Email komt niet aan

1. **Check Resend Logs**:
   - Ga naar Resend dashboard → Emails
   - Zoek de email op messageId
   - Bekijk delivery status

2. **Check DNS Records**:
   ```bash
   # SPF check
   nslookup -type=TXT maasiso.nl
   
   # DKIM check
   nslookup -type=TXT resend._domainkey.maasiso.nl
   ```

3. **Check Spam Folder**: Eerste emails kunnen in spam terechtkomen

### API Errors

**Error: "Resend API key not configured"**
- Controleer of `RESEND_API_KEY` in .env.local staat
- Herstart Next.js dev server

**Error: "Domain not verified"**
- Wacht 10-15 minuten na DNS configuratie
- Klik op "Verify Domain" in Resend dashboard

---

## Kosten Overzicht

### Resend Pricing

- **Free Tier**: 3,000 emails/maand - €0
- **Pro Tier**: 50,000 emails/maand - $20/maand (~€18)
- **Business Tier**: 100,000 emails/maand - $80/maand (~€72)

### Verwacht Gebruik SafeWork Pro

**Development/Early Stage:**
- ~100-500 emails/maand
- ✅ Gratis tier voldoende

**Production (100 organizations):**
- ~2,000-5,000 emails/maand
- ✅ Gratis tier of Pro tier

---

## Volgende Stappen

Na succesvolle Resend setup:

1. ✅ Email systeem is production-ready
2. ⏭️ Implementeer Tasks 7.4-7.5:
   - Web push notifications
   - Webhook system
3. ⏭️ Integreer emails in bestaande flows:
   - User invitations (Task 3.4)
   - TRA approval workflow (Task 4.9)
   - LMRA stop work alerts (Task 5.10)

---

## Support & Documentatie

- **Resend Docs**: https://resend.com/docs
- **API Reference**: https://resend.com/docs/api-reference
- **Status Page**: https://status.resend.com
- **Support**: support@resend.com

---

## Implementatie Details

**Geïmplementeerde Files:**
- [`web/src/lib/notifications/resend-client.ts`](web/src/lib/notifications/resend-client.ts:1) - Resend SDK integratie
- [`web/src/lib/notifications/email-templates.ts`](web/src/lib/notifications/email-templates.ts:1) - 14 email templates
- [`web/src/app/api/notifications/send/route.ts`](web/src/app/api/notifications/send/route.ts:1) - Email API endpoint

**Package Installed:**
```bash
npm install resend --legacy-peer-deps
```

**Environment Variables:**
```bash
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@maasiso.nl
RESEND_FROM_NAME=SafeWork Pro
```

---

**Setup Compleet!** 🎉

Je email systeem is nu klaar voor gebruik met je eigen domain (maasiso.nl).