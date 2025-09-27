const { MongoClient } = require('mongodb');

async function addTransportationCostField() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('supply-desk');
    const collection = db.collection('quotations');
    
    // Find quotations without transportationCost field
    const quotationsWithoutTransportationCost = await collection.find({
      transportationCost: { $exists: false }
    }).toArray();
    
    console.log(`Found ${quotationsWithoutTransportationCost.length} quotations without transportationCost field`);
    
    if (quotationsWithoutTransportationCost.length > 0) {
      // Update all quotations without transportationCost to have default value of 0
      const result = await collection.updateMany(
        { transportationCost: { $exists: false } },
        { 
          $set: { transportationCost: 0 },
          $currentDate: { updatedAt: true }
        }
      );
      
      console.log(`Updated ${result.modifiedCount} quotations with transportationCost: 0`);
      
      // Also need to recalculate grandTotal for these quotations to ensure consistency
      const quotationsToRecalculate = await collection.find({
        transportationCost: 0,
        updatedAt: { $gte: new Date(Date.now() - 60000) } // Updated in last minute
      }).toArray();
      
      for (const quotation of quotationsToRecalculate) {
        const subtotal = quotation.subtotal || 0;
        const discount = quotation.discount || 0;
        const transportationCost = quotation.transportationCost || 0;
        const taxRate = quotation.taxRate || 0;
        
        const afterDiscount = subtotal - discount;
        // Tax should only be calculated on product prices, not transportation cost
        const taxAmount = (afterDiscount * taxRate) / 100;
        const grandTotal = afterDiscount + transportationCost + taxAmount;
        
        await collection.updateOne(
          { _id: quotation._id },
          { 
            $set: { 
              taxAmount: taxAmount,
              grandTotal: grandTotal 
            }
          }
        );
      }
      
      console.log(`Recalculated totals for ${quotationsToRecalculate.length} quotations`);
    } else {
      console.log('All quotations already have transportationCost field');
    }
    
  } catch (error) {
    console.error('Error updating quotations:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
addTransportationCostField().catch(console.error);
