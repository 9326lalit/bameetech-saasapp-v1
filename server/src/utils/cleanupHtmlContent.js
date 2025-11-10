const { Plan } = require('../models');
const { sanitizeHtmlContent } = require('./htmlSanitizer');

const cleanupExistingHtmlContent = async () => {
  try {
    console.log('🧹 Starting HTML content cleanup...');
    
    // Find all plans with HTML content
    const plansWithHtml = await Plan.findAll({
      where: {
        htmlContent: {
          [require('sequelize').Op.ne]: null
        }
      }
    });

    console.log(`📋 Found ${plansWithHtml.length} plans with HTML content`);

    let cleanedCount = 0;
    for (const plan of plansWithHtml) {
      const originalContent = plan.htmlContent;
      const cleanedContent = sanitizeHtmlContent(originalContent);
      
      if (originalContent !== cleanedContent) {
        await plan.update({ htmlContent: cleanedContent });
        cleanedCount++;
        console.log(`✅ Cleaned HTML content for plan: ${plan.name}`);
      }
    }

    console.log(`🎉 Cleanup completed! ${cleanedCount} plans were updated.`);
    return { success: true, cleanedCount, totalPlans: plansWithHtml.length };
  } catch (error) {
    console.error('❌ Error during HTML cleanup:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { cleanupExistingHtmlContent };

// Run if called directly
if (require.main === module) {
  cleanupExistingHtmlContent()
    .then((result) => {
      console.log('Cleanup result:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Cleanup failed:', error);
      process.exit(1);
    });
}