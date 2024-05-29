const jwt = require('jsonwebtoken');
const Database = require('../database');
const axios = require('axios');


const database = new Database();

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


        res.status(201).json({ message: 'success' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Chyba server neodpovidá' });
    }
};


module.exports.deleteTour = async (req, res) => {
    const message = req.body
    const userId = req.user.id;

    try {
        
    } catch (error) {
        
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
                        user.id AS user_id,
                        tour.id AS tour_id
                    
                    FROM 
                        tourmessage
                    JOIN 
                        user ON tourmessage.user_id = user.id
                    JOIN 
                        tour ON tourmessage.tour_id = tour.id
                    WHERE 
                        tour.id = ?; 
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

    console.log(tourMessage)

    try {
        // Validate input
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
