from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium import webdriver
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup
import numpy as np
import newspaper 
import requests
import json
import csv

def reverse(text):
    result = ""
    for i in range(len(text),0,-1):
        result += text[i-1]
    return (result)

def get_n_char_author_from_text(text) :
    n = 0
    for c in reverse(text) :
        if c == '\n':
            return n 
        n = n + 1
    
def write_json(crawlers) :
    with open('crawler.json', 'w', encoding='utf-8') as file:
        json.dump(crawlers, file, indent=4, ensure_ascii=False)


def get_article_by_newspaper(url):
    article = newspaper.Article(url)
    article.download()
    article.parse()
    n = get_n_char_author_from_text(article.text)
    if n is not None :
        article.authors = article.text[-n:]
    
    return article.top_image, article.title, article.text, article.authors

def get_article_by_Soup(url):
    response = requests.get(url)
    response.raise_for_status()  # Kiểm tra nếu có lỗi
    soup = BeautifulSoup(response.text, "html.parser")
    date_published = soup.find("span", class_="date")
    if date_published is not None : 
        date_published = date_published.get_text(strip=True)
    ul_element = soup.find("ul", class_="breadcrumb")
    if ul_element:
        category = [li.get_text(strip=True) for li in ul_element.find_all("li")]
    else:
        category = []
    article_element = soup.find("article", class_="fck_detail")
    if article_element:
        a_list = [[a.get_text(strip=True), a['href']] for a in article_element.find_all("a")]
    else:
        a_list = []
    return date_published, category, a_list

def get_comments_by_selenium(url):
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    driver.get(url)
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    comments = driver.find_elements(By.CLASS_NAME, "comment_item.width_common")
    dates = []
    names = []
    contents = []
    for comment in comments:
        date = "Không rõ ngày"
        name = "Ẩn danh"
        content = ""

        date_elements = comment.find_elements(By.CLASS_NAME, "time-com")
        if date_elements:
            date = date_elements[0].text

        name_elements = comment.find_elements(By.CLASS_NAME, "nickname")
        if name_elements:
            name = name_elements[0].text

        content_elements = comment.find_elements(By.CLASS_NAME, "full_content")
        if content_elements:
            content = content_elements[0].text
            if name in content:
                content = content.replace(name, "").strip()

        dates.append(date)
        names.append(name)
        contents.append(content)
        
    driver.quit()
    return dates, names, contents


if __name__ == '__main__':
    urls = []
    articles = []
    crawlers = []
    with open('./news.csv', newline='') as csvfile: #Ban đầu mới chạy thử 5 url đặc biệt thôi ai rảnh thì chạy 30 cái nha hơi bị lâu 
        reader = csv.reader(csvfile)
        urls = [row[0] for row in reader]
        
    for url in urls :
        top_img, title, text, authors = get_article_by_newspaper(url)
        print(f'Top img : {top_img}\n')
        print(f'Title : {title}\n')
        print(f'Text : {text}\n')
        print(f'Authors : {authors}\n')
    
        date_published, category, a_list = get_article_by_Soup(url)
        print(f'Date : {date_published}\n')
        print(f'Category : {category}\n')
        print(f'List : {a_list}\n')
        
        # date_cmt, nickname, comment = get_comments_by_selenium(url)
        # print(f'Date comment : {date_cmt}\n')
        # print(f'Name : {nickname}\n')
        # print(f'Comment : {comment}\n')
        
        crawler = {
            "Top image": str(top_img) if top_img else "",
            "Title": str(title) if title else "",
            "Author": str(authors) if authors else "",
            "Date": str(date_published) if date_published else "",
            "Content": str(text) if text else "",
            "Category": str(category) if category else "",
            "List tag a": [str(tag) for tag in a_list] if a_list else [],
            # "Comments": {
            #     "Date cmt": [str(date) for date in date_cmt],
            #     "Nickname": [str(name) for name in nickname],
            #     "Comment": [str(cmt) for cmt in comment]
            # }
        }
        crawlers.append(crawler)
        
    write_json(crawlers)
        