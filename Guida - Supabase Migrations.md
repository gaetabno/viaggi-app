## Guida: Come Usare Supabase Migrations

#### Step 1: Setup Iniziale

```bash
# Installa CLI come dipendenza
npm install supabase --save-dev

# Inizializza progetto (crea cartella supabase/)
npm exec supabase init

# Login
npm exec supabase login

# Collega il progetto remoto
npm exec supabase link --project-ref <your-project-id>
```


#### Step 2: Creare la Baseline Migration

Quando hai già un database esistente nel cloud, devi catturare lo stato attuale come baseline:

```bash
# Scarica lo schema remoto esistente
npm exec supabase db pull
```

Questo crea un file tipo `supabase/migrations/20251018000000_remote_schema.sql`.

**IMPORTANTE**: Durante il comando `db pull`, alla fine ti chiederà:

```
Update remote migration history table? [Y/n]
```

**Rispondi `Y` (Yes)**. Questo inserisce automaticamente un record nella tabella `supabase_migrations.schema_migrations` per indicare che questa migrazione è già stata applicata.

Se per errore hai risposto `n` o hai già creato il file, puoi sistemare manualmente con il comando `migration repair`:

```bash
# Marca la migrazione come già applicata
npm exec supabase migration repair <timestamp> --status applied
```

Dove `<timestamp>` è il numero nel nome del file (es. `20251018000000`).

#### Step 3: Verifica lo Stato delle Migrazioni

Controlla che locale e remoto siano allineati:

```bash
npm exec supabase migration list
```

Dovresti vedere qualcosa del tipo:

```
    LOCAL      │     REMOTE     │     TIME (UTC)
───────────────┼────────────────┼────────────────────
  20251018000000 │ 20251018000000 │ 2025-10-18 12:00:00
```

Entrambe le colonne LOCAL e REMOTE devono mostrare lo stesso timestamp.

### Workflow per Nuove Modifiche

Ora che hai la baseline, ecco come gestire i cambiamenti futuri:

#### Metodo A: Modifiche SQL Manuali (Consigliato)

**1. Crea una nuova migrazione:**

```bash
npm exec supabase migration new add_users_table
```

Questo crea `supabase/migrations/<timestamp>_add_users_table.sql`.

**2. Scrivi il SQL nel file:**

```sql
-- supabase/migrations/20251018120000_add_users_table.sql
create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  created_at timestamptz default now()
);

-- Abilita RLS
alter table public.users enable row level security;

-- Aggiungi policy
create policy "Users can read own data"
  on public.users
  for select
  using (auth.uid() = id);
```

**3. Applica al database remoto:**

```bash
# Verifica cosa verrà applicato (dry-run)
npm exec supabase db push -- --dry-run

# Applica effettivamente
npm exec supabase db push
```

`db push` applicherà solo le migrazioni che **non sono ancora nella tabella `schema_migrations`**.[^8][^1][^2]

**4. Verifica:**

```bash
npm exec supabase migration list
```

Dovresti vedere la nuova migrazione in entrambe le colonne.[^6][^2]

#### Metodo B: Modifiche tramite Dashboard + Diff

Se preferisci usare l'interfaccia grafica:[^9][^10][^8]

**1. Fai le modifiche nel Dashboard di Supabase** (crea tabelle, colonne, ecc.)

**2. Genera automaticamente la migrazione:**

```bash
# Crea migrazione dalle differenze tra locale e remoto
npm exec supabase db diff -f describe_changes_here --linked
```

Questo comando:

- Confronta il tuo database remoto con quello locale
- Genera il SQL necessario per allineare il locale al remoto
- Salva il risultato in `supabase/migrations/<timestamp>_describe_changes_here.sql`

**3. Controlla il file generato** per verificare che contenga le modifiche corrette

**4. Applica localmente (se vuoi testare):**

```bash
# Se hai Docker e vuoi testare localmente:
npm exec supabase start
npm exec supabase db reset  # Applica tutte le migrazioni da zero
```

**5. Questa migrazione è già applicata al remoto**, quindi devi marcarla come tale:

```bash
npm exec supabase migration repair <timestamp> --status applied
```


### Gestione Errori Comuni

#### Errore: "Migration history does not match"

Questo succede quando locale e remoto non sono sincronizzati:[^7][^11][^3]

**Soluzione 1 - Reset Completo (se non hai migrazioni importanti)**:[^4][^3]

```bash
# 1. Pulisci la tabella delle migrazioni nel database remoto
# Vai su Supabase Dashboard > SQL Editor ed esegui:
delete from supabase_migrations.schema_migrations;

# 2. Elimina i file di migrazione locali
rm -rf supabase/migrations/*

# 3. Ricrea la baseline
npm exec supabase db pull
# Rispondi Y quando chiede di aggiornare la history table
```

**Soluzione 2 - Repair Manuale (se hai migrazioni da preservare)**:[^5][^2]

```bash
# Vedi quali migrazioni sono problematiche
npm exec supabase migration list

# Marca come applied le migrazioni che sono già nel database remoto
npm exec supabase migration repair <timestamp> --status applied

# Marca come reverted quelle che vuoi ignorare
npm exec supabase migration repair <timestamp> --status reverted
```


#### Errore: "db push tries to re-apply existing migrations"

Questo è esattamente il tuo problema. Succede perché le migrazioni non sono registrate nella tabella `schema_migrations`.[^7][^1][^6]

**Soluzione:**

```bash
# Lista le migrazioni per vedere quali mancano nel remoto
npm exec supabase migration list

# Marca tutte le migrazioni esistenti come applied
npm exec supabase migration repair <timestamp-1> --status applied
npm exec supabase migration repair <timestamp-2> --status applied
# ... per ogni migrazione che esiste già nel database
```


### Script NPM Consigliati

Aggiungi questi al tuo `package.json` per semplificare il workflow:

```json
{
  "scripts": {
    "db:status": "supabase migration list",
    "db:new": "supabase migration new",
    "db:push": "supabase db push",
    "db:push:dry": "supabase db push --dry-run",
    "db:pull": "supabase db pull",
    "db:diff": "supabase db diff --linked -f",
    "db:repair": "supabase migration repair",
    
    "db:start": "supabase start",
    "db:stop": "supabase stop",
    "db:reset": "supabase db reset"
  }
}
```

Uso:

```bash
# Crea nuova migrazione
npm run db:new add_posts_table

# Controlla stato
npm run db:status

# Vedi cosa verrà applicato
npm run db:push:dry

# Applica
npm run db:push

# Genera diff dalle modifiche remote
npm run db:diff my_changes
```


### Best Practices

**1. Un'unica fonte di verità**[^12][^4][^7]

Non mescolare modifiche fatte da Dashboard e modifiche fatte da migrazioni locali. Scegli uno dei due metodi:

- **Opzione A**: Modifiche solo tramite file SQL locali → `db push`
- **Opzione B**: Modifiche solo tramite Dashboard → `db diff` per generare migrazione

**2. Versiona sempre le migrazioni**[^13][^12]

I file in `supabase/migrations/` **devono essere committati in Git**. Non metterli mai in `.gitignore`. Questo permette a tutto il team di avere lo stesso schema.[^12]

**3. Usa `--dry-run` prima di pushare**[^1]

```bash
npm exec supabase db push -- --dry-run
```

Ti mostra cosa verrà eseguito senza applicare effettivamente le modifiche.[^1]

**4. Mantieni le migrazioni piccole e atomiche**[^14][^8]

Ogni migrazione dovrebbe fare una cosa specifica:

- ✅ `add_users_table.sql`
- ✅ `add_email_index_to_users.sql`
- ❌ `big_refactor_everything.sql`

**5. Non modificare mai migrazioni già applicate**[^14][^8]

Se una migrazione è già stata applicata (visibile in `migration list`), non modificarla. Crea una nuova migrazione per le correzioni.

### Risoluzione Definitiva del Tuo Problema

Basandomi sul tuo caso specifico:

```bash
# 1. Verifica lo stato attuale
npm run db:status

# 2. Se vedi migrazioni LOCAL ma non REMOTE, marcale come applied
npm run db:repair 20251018000000 -- --status applied

# 3. Verifica di nuovo
npm run db:status

# 4. Ora db push non dovrebbe più cercare di riapplicarle
npm run db:push:dry
```

Se la situazione è troppo complicata da recuperare:

```bash
# Reset totale - ATTENZIONE: elimina tutto lo storico
# Esegui nel SQL Editor di Supabase Dashboard:
delete from supabase_migrations.schema_migrations;

# Poi localmente:
rm -rf supabase/migrations/*
npm run db:pull  # Crea nuova baseline pulita
# Rispondi Y quando chiesto
```

Questo ti rimette in uno stato pulito da cui partire.[^3][^4]
<span style="display:none">[^15][^16][^17][^18][^19][^20][^21][^22][^23][^24][^25][^26][^27][^28][^29][^30][^31][^32][^33][^34][^35][^36][^37][^38][^39][^40][^41][^42][^43][^44][^45][^46][^47][^48][^49][^50][^51][^52][^53][^54][^55][^56][^57][^58][^59][^60][^61][^62][^63]</span>

<div align="center">⁂</div>

[^1]: https://supabase.com/docs/reference/cli/introduction

[^2]: https://supabase.com/llms/cli.txt

[^3]: https://github.com/supabase/supabase/issues/15695

[^4]: https://www.reddit.com/r/Supabase/comments/1nvt0ne/resetting_database_migrations/

[^5]: https://github.com/orgs/supabase/discussions/11263

[^6]: https://www.reddit.com/r/Supabase/comments/1ipepbp/how_are_you_guys_handling_migrations_between/

[^7]: https://www.answeroverflow.com/m/1335969565787689070

[^8]: https://supabase.com/docs/guides/deployment/database-migrations

[^9]: https://supabase.com/docs/guides/local-development/declarative-database-schemas

[^10]: https://supabase.com/docs/guides/deployment/managing-environments

[^11]: https://github.com/supabase/cli/issues/4009

[^12]: https://www.reddit.com/r/Supabase/comments/1ap9y16/does_supabase_db_pull_actually_pull_the/

[^13]: https://github.com/orgs/supabase/discussions/37503

[^14]: https://chat2db.ai/resources/blog/how-to-manage-supabase-migrations

[^15]: https://arxiv.org/pdf/2309.04197.pdf

[^16]: http://arxiv.org/pdf/2407.02644.pdf

[^17]: http://arxiv.org/pdf/2308.14687.pdf

[^18]: http://arxiv.org/pdf/1608.05564.pdf

[^19]: https://arxiv.org/pdf/2309.11406.pdf

[^20]: https://arxiv.org/pdf/2105.02389.pdf

[^21]: https://www.mdpi.com/2504-2289/5/2/24/pdf?version=1621327330

[^22]: https://arxiv.org/pdf/2207.01124.pdf

[^23]: https://downloads.hindawi.com/journals/mpe/2020/7848232.pdf

[^24]: https://arxiv.org/pdf/2404.08525.pdf

[^25]: http://www.hrpub.org/download/20160130/WJCAT1-13704716.pdf

[^26]: https://arxiv.org/pdf/2202.09365.pdf

[^27]: https://arxiv.org/html/2503.17685v1

[^28]: https://arxiv.org/pdf/2412.12636.pdf

[^29]: https://www.maxwellsci.com/announce/RJASET/7-2421-2426.pdf

[^30]: https://ir.cwi.nl/pub/31600/31600.pdf

[^31]: https://www.youtube.com/watch?v=EALkUlOKvAs\&vl=it

[^32]: https://supabase.com/docs/guides/deployment/branching/working-with-branches

[^33]: https://www.reddit.com/r/Supabase/comments/1emw0dn/how_to_use_migrations/

[^34]: https://github.com/orgs/supabase/discussions/29545

[^35]: https://github.com/supabase/cli/issues/2881

[^36]: https://supabase.com/blog/supabase-local-dev

[^37]: https://github.com/supabase/supabase/issues/32531

[^38]: https://dev.to/tomokat/setting-up-local-supabase-when-migration-scripts-error-out-4k60

[^39]: https://supabase.com/docs/guides/local-development/overview

[^40]: http://link.springer.com/10.1007/s00330-019-06282-w

[^41]: https://academic.oup.com/jimmunol/article/210/Supplement_1/63.01/7947720

[^42]: https://journals.sagepub.com/doi/10.1177/1526602821995831

[^43]: http://biorxiv.org/lookup/doi/10.1101/2024.01.13.575526

[^44]: https://journals.sagepub.com/doi/10.1177/15266028241232915

[^45]: https://ieeexplore.ieee.org/document/9873909/

[^46]: https://journals.sagepub.com/doi/10.1177/23259671251338802

[^47]: https://link.springer.com/10.1007/s00270-025-03996-x

[^48]: https://www.science.org/doi/10.1126/sciadv.adq2519

[^49]: https://www.mp.pl/videosurgery/issue/article/17958/

[^50]: http://arxiv.org/pdf/2306.15516.pdf

[^51]: http://arxiv.org/pdf/2410.16501.pdf

[^52]: https://arxiv.org/pdf/2407.03880.pdf

[^53]: http://arxiv.org/pdf/2309.02804.pdf

[^54]: https://arxiv.org/pdf/1812.04894.pdf

[^55]: https://arxiv.org/pdf/2410.15894.pdf

[^56]: https://zenodo.org/records/7919771/files/Migration_Paper.pdf

[^57]: http://eudl.eu/doi/10.4108/eai.11-4-2018.154463

[^58]: https://github.com/supabase/cli/issues/1721

[^59]: https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore

[^60]: https://github.com/supabase/cli/issues/2534

[^61]: https://www.answeroverflow.com/m/1421843060102271008

[^62]: https://supabase.com/docs/guides/platform/migrating-within-supabase

[^63]: https://blog.stackademic.com/how-to-fix-supabase-migration-history-mismatch-a-quick-solution-6e61cda9ee53

