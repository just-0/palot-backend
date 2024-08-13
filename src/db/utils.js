const xml2js = require('xml2js');


  function parseXML(xmlString) {
    const parser = new xml2js.Parser({ explicitArray: false });
    return new Promise((resolve, reject) => {
      parser.parseString(xmlString, (err, result) => {
        if (err) {
          reject(err);
        } else {
          const plates = result.Plates?.Plate;
          resolve(Array.isArray(plates) ? plates : [plates]);
        }
      });
    });
  }

  module.exports = {
    
    parseXML
  };