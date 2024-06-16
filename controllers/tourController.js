const jwt = require('jsonwebtoken');
const Database = require('../database');
const axios = require('axios');
const crypto = require('crypto');


const database = new Database();


const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32); // Store this securely and reuse the same key for encryption/decryption
const iv = crypto.randomBytes(16); // Initialization vector, should be random for each encryption

function encrypt(text) {
  let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// Function to decrypt text
const decrypt = (encryptedMessage) => {
    try {
        const parts = encryptedMessage.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encryptedData = Buffer.from(parts[1], 'hex');
        const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
        let decrypted = decipher.update(encryptedData);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        console.error('Error decrypting message:', error);
        return 'Error decrypting message';
    }
};


module.exports.getTours = async (req, res) => {
  
    try {

        const tours = await database.query(`
                        SELECT 
                              tour.id,
                              tour.destination,
                              tour.date,
                              tour.tourdate,
                              tour.tourdateEnd,
                              tour.tourtype,
                              tour.fellowtraveler,
                              tour.aboutme,
                            user.firstName AS firstName,
                            user.image AS image
                         FROM 
                            tour
                        JOIN 
                            user ON tour.user_id = user.id

           
                    `); 
    
             
                          // Change the tourtype to an array for each tour
                    const changedTours = tours.map(tour => ({
                        ...tour,
                        tourtype: JSON.parse(tour.tourtype) // Parse the tourtype JSON string to an array
                    }));
                
                    res.status(201).json({ tours: changedTours });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Chyba server neodpovidá' });
    }

}

module.exports.getTour = async (req, res) => {
    const tourId = req.params.id; 

    try {

        const tourExists = await database.query(`
        SELECT 1 FROM tour WHERE id = ?;
    `, [tourId]);

    if (tourExists.length === 0) {
        // If no tour is found, send a 404 response
        return res.status(404).json({ error: 'Tour not found' });
    }

        const tour = await database.query(`
        SELECT
            tour.id,
            tour.destination,
            tour.date,
            tour.tourdate,
            tour.tourdateEnd,
            tour.tourtype,
            tour.fellowtraveler,
            tour.aboutme,
            user.firstName AS firstName,
            user.image AS image
        FROM 
            tour
        JOIN 
            user ON tour.user_id = user.id
        WHERE 
            tour.id = ?; 
    `, [tourId]);
    
             
    const changedTour = tour.map(tour => ({
        ...tour,
        tourtype: JSON.parse(tour.tourtype) // Parse the tourtype JSON string to an array
    }));

    res.status(201).json({ tour: changedTour });
             
  

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Chyba server neodpovidá' });
    }


}



module.exports.createTour = async (req, res) => {
    const tour = req.body;
    const userId = req.user.id;


    try {
        // Validate input
        if (!tour.date.trim().length || !tour.tourdate.trim().length || !tour.tourdateEnd.trim().length ||
            !tour.destination.trim().length || !tour.fellowtraveler.trim().length ||
            !tour.aboutme.trim().length) {
            return res.status(403).json({ error: 'Žádný text' });
        }

        if (tour.fellowtraveler.length > 400 || tour.aboutme.length > 400) {
            return res.status(403).json({ error: 'Příliš dlouhý text , max 400 znaků' });
        }

        if (userId !== tour.user_id) {
            return res.status(401).json({ error: 'Unauthorized User' });
        }

           const query = `
            INSERT INTO tour (
                destination, date, tourdate, tourdateEnd, tourtype, fellowtraveler, aboutme, user_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

      await database.query(query, [
            tour.destination,
            new Date(tour.date),
            new Date(tour.tourdate),
            new Date(tour.tourdateEnd),
            JSON.stringify(tour.tourtype),
            tour.fellowtraveler,
            tour.aboutme,
            userId
        ]);


        res.status(201).json({ message: 'Spulecta úspěšně přidána' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Chyba server neodpovidá' });
    }
};

module.exports.updateYourTour = async (req, res) => {
    const updateTour = req.body;
    const userId = req.user.id;
  
    try {
      console.log(userId);
      console.log(updateTour);
  
      // Fetch the existing tour record
      const tourResult = await database.query('SELECT * FROM tour WHERE id = ?', [updateTour.id]);
      const tour = tourResult[0];
  
      if (!tour) {
        return res.status(404).json({ error: 'Tour not found' });
      }
  
      if (tour.user_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized to update this tour' });
      }
  
      // Format the date strings
      const formattedDate = formatDate(updateTour.date);
      const formattedTourDate = formatDate(updateTour.tourdate);
      const formattedTourDateEnd = formatDate(updateTour.tourdateEnd);
  
      const sql = `UPDATE tour SET destination=?, date=?, tourdate=?, tourdateEnd=?, tourtype=?, fellowtraveler=?, aboutme=? WHERE id=?`;
      await database.query(sql, [
        updateTour.destination,
        formattedDate,
        formattedTourDate,
        formattedTourDateEnd,
        JSON.stringify(updateTour.tourtype),
        updateTour.fellowtraveler,
        updateTour.aboutme,
        updateTour.id,
      ]);
  
      res.status(200).json({ message: 'Tour was successfully updated' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
  
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };
  

    module.exports.deleteYourTour = async (req, res) => {
    const tourId = req.body.tourId;
    const user_id = req.body.user_id;
    const userId =  req.user.id;
console.log(tourId)

    try {

        if (!tourId) {
            return res.status(400).json({ error: 'No tour ID provided' }); 
        }
    
        if (userId !== user_id) {
            return res.status(401).json({ error: 'Unauthorized User' });
        }
    
        const result = await database.query('DELETE FROM tour WHERE id = ?', [tourId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Tour nebyla nalezena' });
        }

        res.status(201).json({ message: 'Tour úspěšně smazána' });
    } catch (err) {
        console.error(err);
           res.status(500).json({ error: 'Chyba serveru' });
    }

}



module.exports.getYourTours = async (req, res) => {
    const userId = req.user.id;
  
    try {

        const tours = await database.query(`
                        SELECT 
                              tour.id,
                              tour.destination,
                              tour.date,
                              tour.tourdate,
                              tour.tourdateEnd,
                              tour.tourtype,
                              tour.fellowtraveler,
                              tour.aboutme,
                            user.firstName AS firstName,
                            user.image AS image
                         FROM 
                            tour
                        JOIN 
                            user ON tour.user_id = user.id
                        WHERE
                            tour.user_id = ?  

           
                    `,userId); 
    
             
                          // Change the tourtype to an array for each tour
                    const changedTours = tours.map(tour => ({
                        ...tour,
                        tourtype: JSON.parse(tour.tourtype) // Parse the tourtype JSON string to an array
                    }));
                
                    res.status(201).json({ tours: changedTours });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Chyba server neodpovidá' });
    }

}


module.exports.getYourTour = async (req, res) => {
    const tourId = req.params.id; 
    try {


        const tours = await database.query(`
                        SELECT 
                              tour.id,
                              tour.destination,
                              tour.date,
                              tour.tourdate,
                              tour.tourdateEnd,
                              tour.tourtype,
                              tour.fellowtraveler,
                              tour.aboutme,
                            user.firstName AS firstName,
                            user.image AS image
                         FROM 
                            tour
                        JOIN 
                            user ON tour.user_id = user.id
                        WHERE
                                 tour.id = ?; 

           
                    `,tourId); 
    
             
                          // Change the tourtype to an array for each tour
                    const changedTours = tours.map(tour => ({
                        ...tour,
                        tourtype: JSON.parse(tour.tourtype) // Parse the tourtype JSON string to an array
                    }));
                
                    res.status(201).json({ tours: changedTours });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Chyba server neodpovidá' });
    }

}

module.exports.getTourMessages = async (req, res) => {

    const tourId = req.params.id; 
  
    try {

        const tourExists = await database.query(`
        SELECT 1 FROM tour WHERE id = ?;
    `, [tourId]);

    if (tourExists.length === 0) {
        // If no tour is found, send a 404 response
        return res.status(404).json({ error: 'Tour not found' });
    }

        const tourMessages = await database.query(`
                    SELECT 
                        tourmessage.id,
                        tourmessage.message,
                        tourmessage.date,
                        user.firstName AS firstName,
                        user.image AS image,
                        user.id AS user_id
            
                    
                    FROM 
                        tourmessage
                    JOIN 
                        user ON tourmessage.user_id = user.id
        
                    WHERE 
                      tourmessage.tour_id = ?; 
                `, [tourId]);
                
                        
                 
                    res.status(201).json({ tourMessages: tourMessages });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Chyba server neodpovidá' });
    }

}


module.exports.createTourMessage = async (req, res) => {
    const tourMessage = req.body;
    const userId = req.user.id;


    try {
        if (!tourMessage.message.trim().length ) {
            return res.status(403).json({ error: 'Žádný text' });
        }

        if (tourMessage.message.length > 400 ) {
            return res.status(403).json({ error: 'Příliš dlouhý text , max 400 znaků' });
        }

        if (userId !== tourMessage.user_id) {
            return res.status(401).json({ error: 'Unauthorized User' });
        }

        

            const query = `
            INSERT INTO tourmessage (
                message, user_id, tour_id
            ) VALUES (?, ?, ?)
        `;

     const newTourMessage =  await database.query(query, [
            tourMessage.message,
            userId,
            tourMessage. tour_id
        ]);


        res.status(201).json({ message: newTourMessage.insertId  });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Chyba server neodpovidá' });
    }
};




module.exports.deleteTourMessage = async (req, res) => {
    const messageId = req.body.messageId;
    const user_id = req.body.user_id;
    const userId =  req.user.id;


    try {

        if (!messageId) {
            return res.status(400).json({ error: 'No message ID provided' }); 
        }
    
        if (userId !== user_id) {
            return res.status(401).json({ error: 'Unauthorized User' });
        }
    
        const result = await database.query('DELETE FROM tourmessage WHERE id = ?', [messageId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Zpráva nebyla nalezena' });
        }

        res.status(201).json({ message: 'Zpráva úspěšně smazána' });
    } catch (err) {
        console.error(err);
           res.status(500).json({ error: 'Chyba serveru' });
    }

}

module.exports.getTourReplies = async (req, res) => {
    const tourId = req.params.id; 
    const user_id_jwt = req.user.id;
  
    try {
        const tourExists = await database.query(`
            SELECT 1 FROM tour WHERE id = ?;
        `, [tourId]);

        if (tourExists.length === 0) {
            return res.status(404).json({ error: 'Tour not found' });
        }

        const tourReplies = await database.query(`
            SELECT 
                tourreply.id,
                tourreply.message,
                tourreply.date,
                tourreply.messageType,
                tourreply.tourmessage_id AS message_id,
                tourmessage.user_id AS message_user_id,
                user.firstName AS firstName,
                user.image AS image,
                user.id AS user_id
            FROM 
                tourreply
            JOIN 
                user ON tourreply.user_id = user.id
            JOIN 
                tourmessage ON tourreply.tourmessage_id = tourmessage.id
            WHERE 
                tourmessage.tour_id = ?
                AND (tourreply.messageType = 0 OR tourreply.user_id = ? OR tourmessage.user_id = ?)
        `, [tourId, user_id_jwt, user_id_jwt]);

        // Decrypt private messages
        tourReplies.forEach(reply => {
            if (reply.messageType === 1) {
                try {
                    console.log(typeof(reply.message),reply.message)
                    reply.message = decrypt(reply.message);
                } catch (error) {
                    console.error('Error decrypting message:', error);
                    reply.message = 'Error decrypting message';
                }
            }
        });

        res.status(200).json({ tourReplies });
    } catch (error) {
        console.error('Error fetching tour replies:', error);
        res.status(500).json({ error: 'Chyba server neodpovidá' });
    }
};



module.exports.createTourReply = async (req, res) => {
    const tourMessage = req.body;
    const userId = req.user.id;

    try {
        // Validate input
        if (!tourMessage.message.trim().length) {
            return res.status(403).json({ error: 'Žádný text' });
        }

        if (tourMessage.message.length > 400) {
            return res.status(403).json({ error: 'Příliš dlouhý text , max 500 znaků' });
        }

        if (userId !== tourMessage.user_id) {
            return res.status(401).json({ error: 'Unauthorized User' });
        }

        let messageToInsert = tourMessage.message;

        if (tourMessage.messageType === 1) {
            messageToInsert = encrypt(tourMessage.message);
        }

        const query = `
            INSERT INTO tourreply (
                message, messagetype, user_id, tourmessage_id
            ) VALUES (?, ?, ?, ?)
        `;

        const newTourReply = await database.query(query, [
            messageToInsert,
            tourMessage.messageType,
            userId,
            tourMessage.message_id
        ]);

        res.status(201).json({ message: newTourReply.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Tato zpráva již neexistuje' });
    }
};



module.exports.deleteTourReply = async (req, res) => {
    const  data = req.body;  
    const userId = req.user.id;
    const messageId = data.messageId
    const user_id = data.user_id


    try {

        if (!messageId) {
            return res.status(400).json({ error: 'No message ID provided' }); 
        }
    
 
        if (userId !== user_id) {
            return res.status(401).json({ error: 'Unauthorized User' });
        }
    
        const result = await database.query('DELETE FROM tourreply WHERE id = ?', [messageId]);


        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Zpráva nebyla nalezena' });
        }

        res.status(201).json({ message: 'Zpráva úspěšně smazána' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Chyba serveru' });
    }
};