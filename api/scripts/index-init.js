
const config = require('config');
var faker = require('faker');
var geobase = require('./geobase.json');
var turf = require('@turf/turf');

turf.sample(geobase, 1)

var MongoClient = require("mongodb").MongoClient;
const url = config.get('mongo.connectionString');
let collectionName = "applications";

faker.locale = "fr";
var entries = [];
for (var i=0; i < 1000; i++) {

    var obj = {
        "status" : "submitted",
        "firstName" : faker.name.firstName(),
        "lastName" : faker.name.lastName(),
        "citizenId" : faker.finance.account(),
        "description" : faker.company.catchPhrase(),
        "assetId" : faker.random.number(),
        "location": turf.sample(geobase, 1).features[0],
        "plannedDate" :  faker.date.future(),
        "audit" : {
            "createdBy" : faker.internet.userName(),
            "createdOn" : faker.date.past()
        }
    };
    entries.push(obj);
}

clientOptions = { useNewUrlParser: true };

MongoClient.connect(url, clientOptions, async function(err, db) {
    if(err){
        return console.log(err.message)
    }
    try {
        console.log('Connexion à la base de données:', url);

        let collectionExists = await db.db().listCollections({ name: collectionName }).hasNext();
        console.log(`La collection ${collectionName}`, collectionExists);
        if (collectionExists) {
            let allo = await db.db().collection(collectionName).drop();
            console.log('Collection supprimée!', collectionName);
        }
        
        // https://docs.mongodb.com/manual/core/index-case-insensitive/
        // https://docs.mongodb.com/manual/reference/collation-locales-defaults/#collation-languages-locales
        // https://docs.mongodb.com/manual/reference/collation/

        console.log("Création des index de champs")
        // Exemple de requête: db.getCollection('Collection4').find({$text: {$search:"collaboration"}})
        // db.collection.createIndex( { "$**": "text" } )
        let textIndex = {
            description: "text",
            firstName: "text",
            lastName: "text"
          }
          let indexOptions = 
          {
            weights: { 
                description: 10,
                firstName: 5
             },
            name: "TextIndex",
            default_language: "french" // https://docs.mongodb.com/manual/reference/text-search-languages/#text-search-languages
          }
        await db.db().collection(collectionName).createIndex(textIndex, indexOptions);

        // Création des index spatiaux
        await db.db().collection(collectionName).createIndex( { 'location.geometry' : "2dsphere" } );
    
        let data = await db.db().collection(collectionName).insertMany(entries,forceServerObjectId=true);
        console.log(`${data.ops.length} insérés dans la collection ${collectionName}`);

        db.close();
    }
    catch (err2) {
        console.log(err2);
        db.close();
    }    
});