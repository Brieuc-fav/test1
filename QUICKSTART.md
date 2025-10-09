# 🚀 Guide de Démarrage Rapide - Video Magic

## ✅ Ce qui a été créé

Votre projet **Video Magic** est maintenant prêt avec :

### 📁 Fichiers créés

```
background_magic/
├── app/
│   ├── api/generate/route.ts    ✅ API de génération de vidéos avec Sora
│   ├── globals.css              ✅ Styles modernes
│   ├── layout.tsx               ✅ Layout React
│   └── page.tsx                 ✅ Interface utilisateur
├── lib/
│   ├── supabase.ts              ✅ Configuration Supabase
│   └── sora.ts                  ✅ Client Azure Sora
├── .env.local                   ✅ Variables d'environnement
├── .gitignore                   ✅ Fichiers à ignorer
├── next.config.js               ✅ Configuration Next.js
├── package.json                 ✅ Dépendances installées
├── tsconfig.json                ✅ Configuration TypeScript
├── README.md                    ✅ Documentation
├── SUPABASE_SETUP.md            ✅ Guide de configuration
└── supabase-setup.sql           ✅ Scripts SQL
```

## 🎯 Prochaines étapes

### 1. Configurer Supabase (IMPORTANT !)

Avant de tester l'application, vous devez configurer Supabase :

👉 **Suivez le fichier `SUPABASE_SETUP.md`** qui contient toutes les instructions détaillées.

En résumé :
- Créer la table `projects`
- Créer les buckets `input-images` et `output-videos`
- Configurer les politiques de sécurité

### 2. Vérifier que le serveur tourne

Le serveur devrait déjà être lancé sur : **http://localhost:3000**

Si ce n'est pas le cas :
```bash
npm run dev
```

### 3. Tester l'application

1. Ouvrez votre navigateur sur http://localhost:3000
2. Sélectionnez une image
3. Entrez un prompt (par exemple : "Make this image come to life with subtle movement")
4. Cliquez sur "Générer la vidéo"
5. Attendez 1-2 minutes
6. Votre vidéo de 1 seconde apparaîtra à droite !

## 🎨 Interface

L'interface se compose de :
- **Section Upload** : Zone de sélection d'image + prompt d'animation
- **Panel Gauche** : Aperçu de l'image d'entrée
- **Panel Droit** : Vidéo générée par Sora (1 seconde)

## 🤖 Modèle IA utilisé

- **Modèle** : Sora (Azure AI Foundry)
- **Fonction** : Génération de vidéos courtes à partir d'images
- **Durée** : 1 seconde
- **Format** : 1080x1080 (carré)
- **Temps** : ~1-2 minutes par vidéo

## 🔧 Dépendances installées

✅ next (14.1.0)
✅ react & react-dom (18.2.0)
✅ typescript (5.3.3)
✅ @supabase/supabase-js (2.39.7)
✅ uuid (9.0.1)

## 📝 Variables d'environnement configurées

✅ SUPABASE_URL
✅ SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY
✅ AZURE_API_KEY
✅ AZURE_SORA_ENDPOINT

## 🐛 Dépannage

### Le serveur ne démarre pas
```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Erreur "Bucket does not exist"
👉 Vous devez créer les buckets dans Supabase (voir SUPABASE_SETUP.md)

### Erreur "Table projects does not exist"
👉 Vous devez créer la table dans Supabase (voir SUPABASE_SETUP.md)

### L'image ne se génère pas
- Vérifiez votre console navigateur (F12) pour les erreurs
- Vérifiez que les buckets sont bien publics
- Vérifiez que la clé Azure API est valide
- Vérifiez que l'endpoint Sora est correct

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez la console du navigateur (F12)
2. Vérifiez les logs du terminal Next.js
3. Vérifiez que Supabase est bien configuré

## 🎉 Prêt à l'emploi !

Une fois Supabase configuré, votre application est 100% fonctionnelle et prête à transformer des images en vidéos avec Sora AI !

---

**Bon développement ! 🎬**
