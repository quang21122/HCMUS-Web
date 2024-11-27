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

export default { createArticle, importArticles };