# 🪟 Installation Foundry sur Windows

## Option 1 : Téléchargement direct des binaires (RECOMMANDÉ)

1. **Télécharger Foundry pour Windows**
   - Allez sur : https://github.com/foundry-rs/foundry/releases
   - Téléchargez `foundry_nightly_windows_amd64.zip` (ou la dernière version)

2. **Extraire et installer**
   ```powershell
   # Créer un dossier pour Foundry
   mkdir C:\foundry
   
   # Extraire le zip téléchargé dans C:\foundry
   # Vous devriez avoir : C:\foundry\bin\forge.exe, cast.exe, anvil.exe
   ```

3. **Ajouter au PATH**
   ```powershell
   # Ajouter au PATH pour la session actuelle
   $env:PATH += ";C:\foundry\bin"
   
   # Pour ajouter de façon permanente :
   [Environment]::SetEnvironmentVariable("PATH", $env:PATH + ";C:\foundry\bin", "User")
   ```

4. **Vérifier l'installation**
   ```powershell
   forge --version
   cast --version
   ```

## Option 2 : Utiliser WSL (Windows Subsystem for Linux)

Si vous avez WSL installé :

```bash
# Dans WSL
curl -L https://foundry.paradigm.xyz | bash
source ~/.bashrc
foundryup
```

## Option 3 : Utiliser les contrats déjà déployés

Si vous voulez juste tester le frontend sans déployer vos propres contrats, vous pouvez utiliser les adresses de contrats de démonstration.

---

## Après installation de Foundry

1. **Installer les dépendances Foundry**
   ```powershell
   cd "C:\Sacha\Cours\Monnaies Numériques\Account Abstraction\erc4337-smart-account-v07-sepolia"
   forge install
   ```

2. **Configurer le .env**
   - Ajoutez votre clé privée
   - Ajoutez votre clé API Pimlico
   - Ajoutez votre clé API Etherscan

3. **Déployer les contrats**
   ```powershell
   npm run deploy
   ```
