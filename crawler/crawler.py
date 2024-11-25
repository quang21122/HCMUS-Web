import newspaper
import csv

def get_article(article):
    article.download()
    article.parse()
    return article.authors, article.publish_date, article.text

if __name__ == '__main__':
    urls = []
    articles = []
    with open('./news.csv', newline='') as csvfile:
        reader = csv.reader(csvfile)
        urls = [row[0] for row in reader]
        articles = [newspaper.Article(url) for url in urls]
    for article in articles:
        authors, publish_date, text = get_article(article)
        print(f"Authors: {authors}")
        print(f"Publish Date: {publish_date}")
        print(f"Text: {text}")
        print("\n")
    