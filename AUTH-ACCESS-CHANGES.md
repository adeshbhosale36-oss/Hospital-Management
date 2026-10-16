# Auth & Access Model Change — What Changed and Why

This note documents the access-model change made to the frontend, and how to
get your very first Admin account into the system now that there's no public
signup path for one.

## What changed

1. **Public signup (`signup.html`) now only creates PATIENT accounts.**
   The "System Role" dropdown has been removed. Anyone visiting `/signup.html`
   creates their own patient account — nothing else.

2. **Doctors don't self-register.** A new panel, **"Provision Doctor Portal
   Access,"** was added to the Doctors page (`doctors.html`). Whoever is
   logged in can open it, type a username + temporary password, and click
   **Create Doctor Login** — this calls the same `/auth/signup` endpoint
   under the hood with the role fixed to `DOCTOR`. Share the username/password
   with the doctor directly; it isn't shown again after creation.

   Note this is separate from the existing "Register Doctor" button/modal on
   that page, which creates a *practitioner profile* (name, specialization,
   department) — the backend has no link between a login account and a
   profile record, so you'll typically do both for a new doctor: create their
   profile, and create their login, as two independent steps.

3. **Admin accounts have no UI at all**, by design — see below for how to
   create the first one.

## Creating your first Admin account

There's no backend endpoint restriction preventing an `ADMIN` signup today —
only the UI hides the option. That gives you two ways to seed the account:

### Option A — Quickest: call the signup endpoint directly once

With the backend running, from a terminal:

```bash
curl -X POST http://localhost:8080/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"ChangeMe123!","role":"ADMIN"}'
```

Change the username/password first. Then log in normally at `/index.html`
with those credentials. Do this once, then treat the UI's hidden option as
the only path going forward.

### Option B — Insert directly into the database

If you'd rather not hit the API at all, insert the row yourself. Spring
Security's `BCryptPasswordEncoder` is standard bcrypt, so any bcrypt library
can generate a compatible hash. Example hash for the password `ChangeMe123!`
(generated with Python's `bcrypt`, cost factor 10 — the same encoder default
Spring Security uses):

```sql
INSERT INTO users (username, password, role)
VALUES ('admin', '$2b$10$thj022NgaddJR9IXvNtn8OaxP7dAro4ZKa30u6xZBj6N5sdB858qy', 'ADMIN');
```

That hash decodes to `ChangeMe123!` — **change the password immediately**
after first login isn't currently possible from the UI either (no
change-password endpoint exists on this backend), so instead just generate
your own hash for whatever password you actually want to use:

```bash
pip install bcrypt
python3 -c "import bcrypt; print(bcrypt.hashpw(b'YOUR_PASSWORD_HERE', bcrypt.gensalt(rounds=10)).decode())"
```

Then substitute that hash into the `INSERT` above.

## Important honesty note: this is a UI restriction, not a security boundary

`POST /auth/signup` on the backend still accepts **any** role in the request
body — it has no idea the frontend stopped offering `ADMIN`/`DOCTOR` as
choices. Anyone who knows the API (Postman, curl, browser dev tools) can
still call it directly and register themselves as `ADMIN`. Hiding the option
in the UI stops accidental/casual misuse, not a deliberate attacker.

If you need this enforced for real, it has to happen in `AuthService.java`
on the backend, roughly:
- Always force `role = PATIENT` for anonymous callers.
- Only allow `role = DOCTOR` in the request if the caller is already
  authenticated **and** holds `ROLE_ADMIN` (checked via
  `SecurityContextHolder.getContext().getAuthentication()`).
- Never allow `role = ADMIN` through this endpoint at all — admins are always
  seeded directly, as above.

That's a backend code change (plus sending the admin's Bearer token on the
provisioning call, which the frontend currently skips for `/auth/**` calls),
which is outside the scope of what this frontend update covers — happy to
make that change too if you'd like real server-side enforcement rather than
just a cleaner UI.
