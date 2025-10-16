# 🔐 Guide d'Authentification - Background Magic

## ✅ Ce qui a été implémenté

### 1. **Infrastructure d'authentification**
- ✅ AuthContext avec React Context API
- ✅ Client Supabase pour le navigateur (`lib/supabase-client.ts`)
- ✅ Client Supabase pour le serveur (`lib/supabase-server.ts`)
- ✅ Hook `useAuth()` pour accéder à l'état de connexion

### 2. **Pages et composants**
- ✅ `/login` - Page de connexion
- ✅ `/signup` - Page d'inscription
- ✅ `/dashboard` - Page protégée avec upload de vidéos
- ✅ `/` - Landing page avec CTA
- ✅ `AuthForm` - Formulaire de connexion/inscription
- ✅ `Header` - Affiche l'email de l'utilisateur et bouton de déconnexion

### 3. **Sécurité et protection**
- ✅ Middleware pour protéger `/dashboard` et `/api/*`
- ✅ API `/api/generate` avec vérification d'authentification
- ✅ API `/api/delete` pour supprimer les projets
- ✅ Fichiers stockés par user_id (`user_id/filename.ext`)

### 4. **Base de données**
- ✅ Script SQL pour ajouter `user_id` à la table `projects`
- ✅ Politiques RLS (Row Level Security) pour la table `projects`
- ✅ Politiques RLS pour les buckets storage (`input-images`, `output-videos`)

---

## 📝 Étapes pour terminer la configuration

### Étape 1 : Mettre à jour la base de données Supabase

1. Allez sur [supabase.com](https://supabase.com) et connectez-vous
2. Sélectionnez votre projet **Background Magic**
3. Allez dans **SQL Editor** (dans le menu de gauche)
4. Copiez le contenu du fichier `supabase-auth-schema.sql`
5. Collez-le dans l'éditeur SQL
6. Cliquez sur **Run** pour exécuter les requêtes

Ce script va :
- Ajouter la colonne `user_id` à la table `projects`
- Créer un index pour améliorer les performances
- Activer RLS (Row Level Security)
- Créer des politiques pour que chaque utilisateur ne voie que ses propres projets
- Créer des politiques pour les buckets storage

### Étape 2 : Activer l'authentification Email dans Supabase

1. Dans votre projet Supabase, allez dans **Authentication** > **Providers**
2. Activez **Email** si ce n'est pas déjà fait
3. Dans **Authentication** > **Email Templates**, personnalisez les emails si vous le souhaitez
4. Dans **Authentication** > **URL Configuration**, ajoutez :
   - **Site URL** : `http://localhost:3000` (pour dev) et votre URL Vercel (pour prod)
   - **Redirect URLs** : Ajoutez `http://localhost:3000/**` et `https://votre-app.vercel.app/**`

### Étape 3 : Tester l'authentification en local

```bash
npm run dev
```

1. Allez sur `http://localhost:3000`
2. Cliquez sur "Commencer gratuitement"
3. Créez un compte avec email/mot de passe
4. Vérifiez votre email et confirmez votre compte
5. Connectez-vous
6. Testez l'upload d'une image et la génération de vidéo
7. Vérifiez que le Header affiche votre email
8. Testez la déconnexion

### Étape 4 : Déployer sur Vercel

1. Poussez vos changements sur GitHub :
```bash
git add .
git commit -m "Add authentication system with Supabase"
git push origin main
```

2. Sur Vercel, ajoutez ces variables d'environnement (en plus des existantes) :
```bash
NEXT_PUBLIC_SUPABASE_URL=https://bodpqqoqrwzlscziflzt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvZHBxcW9xcnd6bHNjemlmbHp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDM0NDYsImV4cCI6MjA3NDM3OTQ0Nn0.cKyvu47Y7_3gZHr-legtasZnl54oEfhpKblbWW9oT14
```

3. Redéployez sur Vercel

4. Dans Supabase, mettez à jour l'URL de production dans **Authentication** > **URL Configuration**

---

## 🔄 Flux d'authentification

### Inscription
1. Utilisateur remplit le formulaire sur `/signup`
2. `AuthContext.signUp()` est appelé
3. Supabase envoie un email de confirmation
4. L'utilisateur clique sur le lien dans l'email
5. Redirection vers `/login`
6. L'utilisateur se connecte

### Connexion
1. Utilisateur remplit le formulaire sur `/login`
2. `AuthContext.signIn()` est appelé
3. Supabase vérifie les credentials
4. Redirection vers `/dashboard`
5. L'utilisateur est maintenant authentifié

### Génération de vidéo
1. Utilisateur upload une image sur `/dashboard`
2. Middleware vérifie l'authentification
3. API `/api/generate` vérifie l'utilisateur
4. Fichiers sont sauvegardés dans `{user_id}/filename.ext`
5. Projet est inséré en DB avec `user_id`
6. RLS garantit que seul l'utilisateur peut voir son projet

---

## 🛡️ Sécurité

### Protection des routes
- Le middleware protège `/dashboard` et `/api/*`
- Redirection vers `/login` si non authentifié
- Les cookies de session sont gérés automatiquement par Supabase

### Protection des données
- **Row Level Security (RLS)** : Chaque utilisateur ne peut voir/modifier que ses propres projets
- **Storage Policies** : Les fichiers sont organisés par `user_id` avec des politiques RLS
- **API Protection** : Toutes les API vérifient l'authentification avant d'agir

### Bonnes pratiques
- Les clés publiques (`NEXT_PUBLIC_*`) sont sûres pour le client
- La `SERVICE_ROLE_KEY` reste côté serveur uniquement
- Les politiques RLS empêchent les accès non autorisés même si un utilisateur connaît l'ID d'un projet

---

## 🎨 Personnalisation

### Modifier les emails de Supabase
1. Allez dans **Authentication** > **Email Templates**
2. Personnalisez les templates pour :
   - Confirmation d'email
   - Réinitialisation de mot de passe
   - Changement d'email

### Ajouter des fonctionnalités
- **Mot de passe oublié** : Utilisez `supabase.auth.resetPasswordForEmail()`
- **Changer le mot de passe** : Utilisez `supabase.auth.updateUser()`
- **Profil utilisateur** : Créez une table `profiles` liée à `auth.users`
- **Photos de profil** : Ajoutez un bucket `avatars` avec RLS

---

## 🐛 Dépannage

### Erreur "Invalid login credentials"
- Vérifiez que l'email est confirmé (regardez dans l'onglet **Authentication** de Supabase)
- Vérifiez que le mot de passe est correct (minimum 6 caractères)

### Erreur "Not authenticated" sur /dashboard
- Vérifiez que les cookies sont activés dans votre navigateur
- Effacez le cache et les cookies
- Vérifiez que `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` sont définis

### Les fichiers ne s'uploadent pas
- Vérifiez que les politiques RLS sont bien appliquées sur les buckets
- Vérifiez que le `user_id` est bien passé dans le chemin du fichier
- Regardez les logs de Supabase dans **Database** > **Logs**

### Le middleware redirige en boucle
- Vérifiez que le pattern du matcher ne capture pas `/login` ou `/signup`
- Vérifiez que les cookies sont bien propagés dans le middleware

---

## 📚 Ressources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage](https://supabase.com/docs/guides/storage)

---

## ✅ Checklist finale

- [ ] Script SQL exécuté dans Supabase
- [ ] Authentification Email activée dans Supabase
- [ ] URL de redirection configurées dans Supabase
- [ ] Test de l'inscription en local
- [ ] Test de la connexion en local
- [ ] Test de la génération de vidéo en local
- [ ] Variables d'environnement ajoutées sur Vercel
- [ ] Déployé sur Vercel
- [ ] Test de l'authentification en production
- [ ] Test de la génération de vidéo en production

Bravo ! 🎉 Votre application est maintenant sécurisée avec un système d'authentification complet !
