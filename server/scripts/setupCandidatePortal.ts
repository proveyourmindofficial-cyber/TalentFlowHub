/**
 * Script to set up candidate portal access for existing candidates
 * This script adds a default password and enables portal access for candidates
 */
import { candidateAuth } from '../candidateAuth';
import { storage } from '../storage';
import bcrypt from 'bcrypt';

async function setupCandidatePortalAccess() {
  try {
    console.log('Setting up candidate portal access...');
    
    // Get all candidates
    const candidates = await storage.getCandidates();
    console.log(`Found ${candidates.length} candidates`);
    
    for (const candidate of candidates) {
      if (!candidate.isPortalActive) {
        // Generate a default password (candidates should change this)
        const defaultPassword = `temp${candidate.email.split('@')[0]}123`;
        const hashedPassword = await bcrypt.hash(defaultPassword, 12);
        
        // Update candidate with portal access
        await storage.updateCandidate(candidate.id, {
          password: hashedPassword,
          isPortalActive: true,
        });
        
        console.log(`✅ Portal access enabled for ${candidate.name} (${candidate.email})`);
        console.log(`   Default password: ${defaultPassword}`);
        console.log('   ⚠️  Candidate should change this password after first login\n');
      } else {
        console.log(`✓ Portal already active for ${candidate.name} (${candidate.email})`);
      }
    }
    
    console.log('🎉 Candidate portal setup complete!');
    console.log('\nNext steps:');
    console.log('1. Share the portal URL: /portal');
    console.log('2. Send candidates their login credentials');
    console.log('3. Ask them to change their passwords after first login');
    
  } catch (error) {
    console.error('Error setting up candidate portal:', error);
  }
}

// Run if called directly
if (require.main === module) {
  setupCandidatePortalAccess();
}

export { setupCandidatePortalAccess };