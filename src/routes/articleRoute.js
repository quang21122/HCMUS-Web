import articleController from '../controllers/articleController.js';

const handler = async (req, res) => {
    if (req.url.startsWith('/import') && req.method === 'POST') {
        return articleController.importArticles(req, res);
    }
    
    if (req.method === 'POST') {
        return articleController.createArticle(req, res);
    }

    if (req.method === 'GET') {
        return articleController.readArticle(req, res);
    }

    if (req.method === 'PUT') {
        return articleController.updateArticle(req, res);
    }

    if (req.method === 'DELETE') {
        return articleController.deleteArticle(req, res);
    }
}

export default handler;