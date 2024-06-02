const jwt = require('jsonwebtoken');
const Database = require('../database');
const axios = require('axios');


const database = new Database();

module.exports.createMessage = async (req, res) => {
    const message = req.body
    const userId = req.user.id;

   
    try {
        if (!message.message.trim().length) {
            return res.status(403).json({ error: 'Žádný text' });
        }
  
        if (message.message.length > 400 ) {
            return res.status(403).json({ error: 'Příliš dlouhý text , max 250 znaků' });
  }
  
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
    
        const result = await database.query('DELETE FROM message WHERE id = ?', [messageId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Zpráva nebyla nalezena' });
        }

        res.status(201).json({ message: 'Zpráva úspěšně smazána' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Chyba serveru' });
    }
};

//// replies

module.exports.createReply = async (req, res) => {
    const message = req.body
    const userId = req.user.id;
   
    try {

            if (!message.message.length) {
                return res.status(403).json({ error: 'Žádný text' });
      }
      

        if (message.message.length > 400 ) {
            return res.status(403).json({ error: 'Příliš dlouhý text , max 250 znaků' });
      }
  
  
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
    
        const result = await database.query('DELETE FROM reply WHERE id = ?', [messageId]);


        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Zpráva nebyla nalezena' });
        }

        res.status(201).json({ message: 'Zpráva úspěšně smazána' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Chyba serveru' });
    }
};

module.exports.getBlogs = async (req, res) => {
    const countryId = req.params.id; 

    try {

        const cards = await database.query(`
                        SELECT 
                            video.id,
                            video.title,
                            video.video,
                            video.user_id,
                            user.firstName AS firstName
                         FROM 
                            video
                        JOIN 
                            user ON video.user_id = user.id
                        WHERE 
                            video.country = ?; 
                    `, [countryId]); 
    
             

             
            res.status(201).json({cards:cards});

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Chyba server neodpovidá' });
    }

}

module.exports.createBlog = async (req, res) => {
    const card = req.body
    const userId = req.user.id;
   
    try {
        if (!card.title.trim().length || !card.video.trim().length  ) {
            return res.status(403).json({ error: 'Žádný text' });
        
  }
  
        if (card.title.length > 100  || card.video.length > 100 ) {
            return res.status(403).json({ error: 'Příliš dlouhý text , max 100 znaků' });
  }
  
       
        
        if (userId !== card.user_id) {
            return res.status(401).json({ error: 'Unauthorized User' });
        }

        
        const newBlog = await database.query('INSERT INTO video (country,title,video,user_id) VALUES (?, ?, ? ,?)', [card.country,card.title,card.video,userId]);
         res.status(201).json({ message: newBlog.insertId });
       


    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Chyba server neodpovidá' });
    }

}


module.exports.getYourBlogs = async (req, res) => {
    const userId = req.user.id;
   
    try {

          const cards = await database.query(`
                        SELECT 
                            video.id,
                            video.title,
                            video.country,
                            video.video,
                            video.user_id,
                            user.firstName AS firstName
                         FROM 
                            video
                        JOIN 
                            user ON video.user_id = user.id
                        WHERE 
                        user.id = ?; 
                    `, [userId]); 
    
             
            res.status(201).json({cards:cards});

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Chyba server neodpovidá' });
    }

}


module.exports.updateBlog = async (req, res) => {
    const card = req.body

    try {
  
        
        const sql = `UPDATE video SET title=?, video=? WHERE id=?`;
        
        const response =  await database.query(sql, [card.title,card.video, card.id]);
        res.status(201).json({response});
    } catch (err) {
        console.error('Error updating user profile:', err);
        res.status(500).json({ error: 'Chyba server neodpovidá' });
    }
}


module.exports.deleteBlog = async (req, res) => {
    const values = req.body
    const userId = req.user.id;
   

    try {

        if (userId === values.user_id) {
     
          const response = await database.query('DELETE FROM video WHERE id = ?', [values.id]);
         res.status(201).json({response}); 
        }
    } catch (err) {
        console.error('Error updating user profile:', err);
        res.status(500).json({ error: 'Chyba server neodpovidá' });
    }
}
