from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor
import time

base_url = "https://dokkan.wiki"
card_links = []

# Function to scrape card links from a single page
def scrape_card_links_page(page_number):
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=False)
            url = f"{base_url}/cards#!(p:{page_number})"
            print(f"Scraping Page: {url}")
            page = browser.new_page()

            try:
                page.goto(f"{base_url}/cards#!(p:{page_number})", wait_until="load", timeout=60000)
                soup = BeautifulSoup(page.content(), 'html.parser')
                card_elements = soup.find_all('a', class_='card-thumb-wrapper')
                page_links = []

                for card in card_elements:
                    rarity_img = card.find('img', class_='card-rarity')
                    if rarity_img and rarity_img['src'] in [
                        "/assets/global/en/layout/en/image/character/cha_rare_sm_ur.png",
                        "/assets/global/en/layout/en/image/character/cha_rare_sm_lr.png"
                    ]:
                        href = card['href']
                        full_link = base_url + href
                        page_links.append(full_link)

                card_links.extend(page_links)
                page.close()
                browser.close()
            except Exception as e:
                print(f"Error scraping page {page_number}: {e}")

            finally:
                page.close()       # Ensures page closure
                browser.close()    # Ensures browser closure

    except Exception as e:
        print(f"Error scraping page {page_number}: {e}")

# Function to start the scraping process with threads
def scrape_all_pages():
    with ThreadPoolExecutor(max_workers=5) as executor:
        executor.map(scrape_card_links_page, range(1, 42))

# Run the scraping function
start_time = time.time()
scrape_all_pages()
end_time = time.time()

# Save the list of card links to a file (optional)
with open("card_links.txt", "w", encoding="utf-8") as file:
    for link in card_links:
        file.write(link + "\n")

print(f"Scraped {len(card_links)} card links in {end_time - start_time:.2f} seconds.")