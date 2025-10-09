// Script de test pour vérifier la configuration Azure Sora
// Exécuter avec: node test-sora.js

const AZURE_API_KEY = process.env.AZURE_API_KEY;
const AZURE_SORA_ENDPOINT = process.env.AZURE_SORA_ENDPOINT;

if (!AZURE_API_KEY || !AZURE_SORA_ENDPOINT) {
  console.error('❌ ERREUR: Variables d\'environnement manquantes!');
  console.error('Assurez-vous que .env.local contient:');
  console.error('  AZURE_API_KEY=your_api_key_here');
  console.error('  AZURE_SORA_ENDPOINT=your_endpoint_here');
  process.exit(1);
}

console.log('🔍 Configuration Azure Sora:');
console.log('- API Key:', AZURE_API_KEY ? `${AZURE_API_KEY.substring(0, 20)}...` : 'NOT SET');
console.log('- Endpoint:', AZURE_SORA_ENDPOINT);
console.log('');

async function testSoraAPI() {
  console.log('🎬 Test 1: Création d\'un job de génération vidéo...\n');

  const testPrompt = 'A beautiful sunset over the ocean with gentle waves';

  try {
    const response = await fetch(AZURE_SORA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-key': AZURE_API_KEY,
      },
      body: JSON.stringify({
        model: 'sora',
        prompt: testPrompt,
        height: 1080,
        width: 1080,
        n_seconds: 1,
        n_variants: 1,
      }),
    });

    console.log('Status HTTP:', response.status, response.statusText);
    
    const responseText = await response.text();
    console.log('Réponse brute:', responseText);
    console.log('');

    if (!response.ok) {
      console.error('❌ ERREUR: La requête a échoué');
      try {
        const errorData = JSON.parse(responseText);
        console.error('Détails de l\'erreur:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.error('Impossible de parser l\'erreur:', responseText);
      }
      return;
    }

    const jobData = JSON.parse(responseText);
    console.log('✅ Job créé avec succès!');
    console.log('Job ID:', jobData.id);
    console.log('Job complet:', JSON.stringify(jobData, null, 2));
    
    if (jobData.id) {
      console.log('\n🔄 Vous pouvez vérifier le statut avec:');
      console.log(`GET ${AZURE_SORA_ENDPOINT.split('?')[0]}/${jobData.id}?api-version=preview`);
    }

  } catch (error) {
    console.error('❌ ERREUR lors de l\'appel API:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Exécuter le test
testSoraAPI().catch(console.error);
