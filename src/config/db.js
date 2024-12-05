import mongoose from "mongoose";

let dbConnection = null;

const createIndexes = async () => {
  try {
    await mongoose.connection.collection("articles").createIndex({ _id: 1 });
    await mongoose.connection
      .collection("articles")
      .createIndex({ category: 1 });
    console.log("Indexes created successfully");
  } catch (error) {
    console.error("Error creating indexes:", error);
  }
};

export const connectDB = async () => {
  if (dbConnection) {
    return dbConnection;
  }

  try {
    const conn = await mongoose.connect(
      "mongodb+srv://howtobefun:1RokJ1C3AfU02i83@football-prediction.ncci4.mongodb.net/newspapers_web",
      {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000,
        maxPoolSize: 10,
        minPoolSize: 5,
      }
    );

    dbConnection = conn;
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Create indexes after successful connection
    await createIndexes();

    return dbConnection;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
