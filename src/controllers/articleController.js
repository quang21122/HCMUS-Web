import articleService from '../services/articleService.js';

const createArticle = async (req, res) => {
    try {
        const data = req.body;

        // Check if the request is for an array of articles
        if (Array.isArray(data)) {
            const results = await articleService.createMultipleArticles(data);

            return res.status(201).json({
                data: results
            });
        } 

        const result = await articleService.createArticle(data);

        if (result.error) {
            return res.status(result.status).json(result.error);
        }

        return res.status(201).json({
            data: result
        });
    } catch (err) {
        return res.status(400).json({
            message: err.message
        });
    }
};

const importArticles = async (req, res) => {
    try {
        const results = await articleService.importArticlesFromLocal();

        return res.status(201).json({
            data: results
        });
    } catch (err) {
        return res.status(400).json({
            message: err.message
        });
    }
}

const readArticle = async (req, res) => {
    try {
        const id = req.query._id;
        // Kiểm tra nếu không có _id trong query
        if (!id) {
            return res.status(400).json({ error: "Missing _id parameter" });
        }
        const article = await articleService.readArticle(id);

        if (article.error) {
            return res.status(article.status).json(article.error);
        }

        return res.status(200).json({
            data: article
        });

    } catch (err) {
        return res.status(400).json({
            message: err.message
        });
    }
}

const updateArticle = async (req, res) => {
    try {
        const {id, ...data} = req.body;

        // Kiểm tra nếu không có _id trong query
        if (!id) {
            return res.status(400).json({ error: "Missing _id parameter" });
        }
        
        const result = await articleService.updateArticle(id, data);

        if (result.error) {
            return res.status(result.status).json(result.error);
        }

        return res.status(200).json({
            data: result
        });
    } catch (err) {
        return res.status(400).json({
            message: err.message
        });
    }
}

const deleteArticle = async (req, res) => {
    try {
        const id = req.query._id;

        // Kiểm tra nếu không có _id trong query
        if (!id) {
            return res.status(400).json({ error: "Missing _id parameter" });
        }
        const result = await articleService.deleteArticle(id);

        if (result.error) {
            return res.status(result.status).json(result.error);
        }

        return res.status(200).json({
            data: result
        });
    } catch (err) {
        return res.status(400).json({
            message: err.message
        });
    }
}

export default { createArticle, importArticles, readArticle, updateArticle, deleteArticle };