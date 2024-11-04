const Company = require("../models/users/Companies");

const getAllCompanies = async () =>{
    const companies = await Company.findAll();
    return companies;
}

module.exports = {
    getAllCompanies
};
