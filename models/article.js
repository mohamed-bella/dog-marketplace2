const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Article schema
const ArticleSchema = new Schema({
     slug: {
          type: String,
          unique: true, // Ensure slugs are unique
          required: true
     },
     title: {
          type: String,
          required: true,
     },
     description: {
          type: String,
          required: true
     },
     content: {
          type: String,
          required: true,
     },
     bannerImage: {
          type: String // URL for the image stored in Cloudinary
     },
     author: {
          type: String, // You can store the admin's name or id who created the article
          default: 'Admin',
     },
     dateCreated: {
          type: Date,
          default: Date.now,
     },
     dateUpdated: {
          type: Date,
          default: Date.now,
     },
     tags: [String], // Optional: You can add tags to the article for better categorization
});

// Automatically update the `dateUpdated` field before saving
ArticleSchema.pre('save', function (next) {
     this.dateUpdated = Date.now();
     next();
});

// Create and export the Article model
const Article = mongoose.model('Article', ArticleSchema);
module.exports = Article;
