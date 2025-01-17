const User = require("../models/users/User");
const getUsers = async(userId,role)=>{
    if(role==="personal"){
        return res.status(403).json({ error: "Bu işlemi yapmak için yetkiniz yok." });
    }

    let user;
    if(role==="administrator"){
        user = await User.findAll();
    }else{
        user = await User.findAll({
            where: { creator_id: userId }
        });
    }
    console.log(user);
    return user;
}

module.exports = {
    getUsers
};