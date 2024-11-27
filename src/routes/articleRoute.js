import articleController from '../controllers/articleController.js';

const handler = async (req, res) => {
    if (req.url.startsWith('/import') && req.method === 'POST') {
        return articleController.importArticles(req, res);
    }
    
    if (req.method === 'POST') {
        return articleController.createArticle(req, res);
    }
}

export default handler;