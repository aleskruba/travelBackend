const jwt = require('jsonwebtoken');
const Database = require('../database');
const axios = require('axios');


const database = new Database();

module.exports.createMessage = async (req, res) => {
    const message = req.body
    const token = req.cookies.jwt;

   
    try {

        if (message.message.length > 400 ) {
            return res.status(403).json({ error: 'Příliš dlouhý text , max 250 znaků' });
  }
  
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }
        
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decodedToken.id;
    
        
        
        if (userId !== message.user_id) {
            return res.status(401).json({ error: 'Unauthorized User' });
        }

        
        const newMessage = await database.query('INSERT INTO message (message,country,user_id) VALUES (?, ?, ? )', [message.message,message.country,userId]);
        res.status(201).json({ message: newMessage.insertId });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Chyba server neodpovidá' });
    }
}




module.exports.getMessages = async (req, res) => {
    const countryId = req.params.id; 

    try {

        const messages = await database.query(`
                        SELECT 
                            message.id,
                            message.date,
                            message.message,
                            message.user_id,
                            user.firstName AS firstName,
                            user.email AS email,
                            user.image AS image
                        FROM 
                            message
                        JOIN 
                            user ON message.user_id = user.id
                        WHERE 
                            message.country = ?; 
                    `, [countryId]);
    

             
            res.status(201).json(messages);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Chyba server neodpovidá' });
    }
}





module.exports.deleteMessage = async (req, res) => {
    const  data = req.body;  
    const token = req.cookies.jwt;
    const messageId = data.messageId
    const user_id = data.user_id


    try {

        if (!messageId) {
            return res.status(400).json({ error: 'No message ID provided' }); 
        }
    
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decodedToken.id;
  
        if (userId !== user_id) {
            return res.status(401).json({ error: 'Unauthorized User' });
        }
    
        const result = await database.query('DELETE FROM message WHERE id = ?', [messageId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Zpráva nebyla nalezena' });
        }

        res.status(201).json({ message: 'Zpráva úspěšně smazána' });
    } catch (err) {
        console.error(err);
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }
        res.status(500).json({ error: 'Chyba serveru' });
    }
};

//// replies

module.exports.createReply = async (req, res) => {
    const message = req.body
    const token = req.cookies.jwt;

    console.log(message)
   
    try {

        if (message.message.length > 400 ) {
            return res.status(403).json({ error: 'Příliš dlouhý text , max 250 znaků' });
  }
  
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }
        
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decodedToken.id;
    
        
        
        if (userId !== message.user_id) {
            return res.status(401).json({ error: 'Unauthorized User' });
        }
  
        const newReply = await database.query('INSERT INTO reply (message,message_id,user_id) VALUES (?, ?, ? )', [message.message,message.message_id,userId]);
        res.status(201).json({ message: newReply.insertId }); 
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Chyba server neodpovidá' });
    }
}




module.exports.getReplies = async (req, res) => {
    const countryId = req.params.id; 
    console.log(countryId)

    try {

        const replies = await database.query(`
                        SELECT 
                            reply.id,
                            reply.date,
                            reply.message,
                            reply.user_id,
                            reply.message_id,
                            user.firstName AS firstName,
                            user.email AS email,
                            user.image AS image


                        FROM 
                            reply
                        JOIN 
                            user ON reply.user_id = user.id
                        JOIN 
                            message ON reply.message_id = message.id    
                        WHERE 
                            message.country = ?; 
              
                    `, [countryId]);
    

             
            res.status(201).json(replies);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Chyba server neodpovidá' });
    }
}





module.exports.deleteReply = async (req, res) => {
    const  data = req.body;  
    const token = req.cookies.jwt;
    const messageId = data.messageId
    const user_id = data.user_id


    try {

        if (!messageId) {
            return res.status(400).json({ error: 'No message ID provided' }); 
        }
    
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decodedToken.id;
  
        if (userId !== user_id) {
            return res.status(401).json({ error: 'Unauthorized User' });
        }
    
        const result = await database.query('DELETE FROM message WHERE id = ?', [messageId]);


        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Zpráva nebyla nalezena' });
        }

        res.status(201).json({ message: 'Zpráva úspěšně smazána' });
    } catch (err) {
        console.error(err);
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }
        res.status(500).json({ error: 'Chyba serveru' });
    }
};

