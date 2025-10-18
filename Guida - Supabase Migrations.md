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

`db push` applicherà solo le migrazioni che **non sono ancora nella tabella `schema_migrations`**.

**4. Verifica:**

```bash
npm exec supabase migration list
```

Dovresti vedere la nuova migrazione in entrambe le colonne.

#### Metodo B: Modifiche tramite Dashboard + Diff

Se preferisci usare l'interfaccia grafica:

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

Questo succede quando locale e remoto non sono sincronizzati:

**Soluzione 1 - Reset Completo (se non hai migrazioni importanti)**:

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

**Soluzione 2 - Repair Manuale (se hai migrazioni da preservare)**:

```bash
# Vedi quali migrazioni sono problematiche
npm exec supabase migration list

# Marca come applied le migrazioni che sono già nel database remoto
npm exec supabase migration repair <timestamp> --status applied

# Marca come reverted quelle che vuoi ignorare
npm exec supabase migration repair <timestamp> --status reverted
```


#### Errore: "db push tries to re-apply existing migrations"

Questo è esattamente il tuo problema. Succede perché le migrazioni non sono registrate nella tabella `schema_migrations`.

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

**1. Un'unica fonte di verità**

Non mescolare modifiche fatte da Dashboard e modifiche fatte da migrazioni locali. Scegli uno dei due metodi:

- **Opzione A**: Modifiche solo tramite file SQL locali → `db push`
- **Opzione B**: Modifiche solo tramite Dashboard → `db diff` per generare migrazione

**2. Versiona sempre le migrazioni**

I file in `supabase/migrations/` **devono essere committati in Git**. Non metterli mai in `.gitignore`. Questo permette a tutto il team di avere lo stesso schema.

**3. Usa `--dry-run` prima di pushare**

```bash
npm exec supabase db push -- --dry-run
```

Ti mostra cosa verrà eseguito senza applicare effettivamente le modifiche.

**4. Mantieni le migrazioni piccole e atomiche**

Ogni migrazione dovrebbe fare una cosa specifica:

- ✅ `add_users_table.sql`
- ✅ `add_email_index_to_users.sql`
- ❌ `big_refactor_everything.sql`

**5. Non modificare mai migrazioni già applicate**

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

Questo ti rimette in uno stato pulito da cui partire.
