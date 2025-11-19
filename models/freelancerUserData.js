const mongoose = require('mongoose');

const freelancer = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    Profession: {
        type: String,
        required: true,
    },
    Bio: {
        type: String,
        required: false,
    },
    Skills: {
        type: String,
        required: false,
    },
    Location: {
        type: String,
        required: false,
    },
    Experience: {
        type: String,
        required: false,
    },
    Portfolio: {
        type: String,
    },
    Baseprice: {
        type: Number,
    },
});

module.exports = mongoose.model("FreelancerData", freelancer);