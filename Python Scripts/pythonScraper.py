from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup, NavigableString
import json
from urllib.parse import urljoin
from concurrent.futures import ThreadPoolExecutor

base_url = "https://dokkan.wiki"
urls = []

with open("card_links.txt", "r", encoding="utf-8") as file:
    urls = [line.strip() for line in file]

def scrape_card(url, all_data):
    print(f"Scraping URL: {url} - {urls.index(url)+1} / {len(urls)}")

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=False)
            page = browser.new_page()
            page.goto(url, timeout=100000)

            page.wait_for_selector('#passive-skill .card-body', state='attached', timeout=30000)
            page.wait_for_selector('#leader-skill .card-body', state='attached', timeout=30000)

            soup = BeautifulSoup(page.content(), 'html.parser')

            data = {}
            
            # Checks if z-awakens
            card_rarity_image = soup.find('img', src='/assets/global/en/layout/en/image/charamenu/dokkan/dok_img_z.png')
            z_awakens = card_rarity_image is not None  # True if the specific src is found, False otherwise

            if not z_awakens:
                title_section = soup.find('div', class_='col col-lg d-flex flex-column justify-content-center align-items-center')
                if title_section:
                    title = title_section.find('h3')
                    name = title_section.find('h1')
                    if title:
                        data['Title'] = title.text.strip()
                    if name:
                        data['Name'] = name.text.strip()

                # Extract Passive Skill
                passive_section = soup.find('div', {'id': 'passive-skill'})
                passive_body = passive_section.find('div', class_='card-body') if passive_section else None
                if passive_body:
                    passive_data = {}
                    for strong_tag in passive_body.find_all('strong'):
                        key = ""
                        for element in strong_tag.contents:
                            if isinstance(element, NavigableString):
                                key += element.strip()
                            elif element.name == 'img':
                                element['src'] = base_url+element['src']
                                img_src = element
                                if img_src:
                                    imageName = element['src'].split('/')[-1]
                                    if imageName == "passive_skill_dialog_arrow01.png" or imageName == "passive_skill_dialog_arrow03.png":
                                        #no space before arrows
                                        key += f"{img_src} "
                                    else:
                                        #Status icons
                                        key += f" {img_src} "

                        values = strong_tag.find_next('ul').find_all('li')

                        value_list = []
                        for li in values:
                            combined_text = ""
                            for element in li.contents:
                                if isinstance(element, NavigableString):
                                    combined_text += element.strip()
                                elif element.name == 'img':
                                    element['src'] = base_url+element['src']
                                    img_src = element
                                    if img_src:
                                        imageName = element['src'].split('/')[-1]
                                        if imageName == "passive_skill_dialog_arrow01.png" or imageName == "passive_skill_dialog_arrow03.png":
                                            #no space before arrows
                                            combined_text += f"{img_src} "
                                        else:
                                            #Status icons
                                            combined_text += f" {img_src} "
                            value_list.append(combined_text)

                        passive_data[key] = ". ".join(value_list)
                    data['Passive Skill'] = passive_data

                # Extract Leader Skill
                leader_section = soup.find('div', {'id': 'leader-skill'})
                leader_body = leader_section.find('div', class_='card-body') if leader_section else None
                if leader_body:
                    leader_text = leader_body.get_text(separator=' ', strip=True)
                    data['Leader Skill'] = leader_text

                # Extract Images
                card_thumb_section = soup.find('div', {'id': 'card--desktop-card-thumb'})
                if card_thumb_section:
                    images = {}
                    card_thumb_bg = card_thumb_section.find('img', class_='card-thumb-bg')
                    if card_thumb_bg:
                        images['card_thumb_bg'] = urljoin(base_url, card_thumb_bg['src'])

                    card_thumb_character = card_thumb_section.find('img', class_='card-thumb-character')
                    if card_thumb_character:
                        images['card_thumb_character'] = urljoin(base_url, card_thumb_character['src'])

                    card_rarity = card_thumb_section.find('img', class_='card-rarity')
                    if card_rarity:
                        if card_rarity['src'].split('/')[-1] == "cha_rare_sm_ur.png":
                            images['card_rarity'] = "images/rarity_UR.png"
                        elif card_rarity['src'].split('/')[-1] == "cha_rare_sm_lr.png":
                            images['card_rarity'] = "images/rarity_LR.png"

                    card_element = card_thumb_section.find('img', class_='card-element')
                    if card_element:
                        images['card_element'] = urljoin(base_url, card_element['src'])

                    # EZA/SEZA
                    card_eza_svg = card_thumb_section.find('svg', class_='card-eza')
                    card_seza_svg = card_thumb_section.find('svg', class_='card-eza card-super-eza')
                    if card_seza_svg:
                        images['card_eza'] = "images/card_super_eza.png"
                    elif card_eza_svg:
                        images['card_eza'] = "images/card_eza.png"

                    data['Images'] = images

                all_data.append(data)

            browser.close()

    except Exception as e:
        print(f"Error scraping {url}: {e}")

# Using ThreadPoolExecutor to scrape multiple cards concurrently
def main():
    all_data = []
    with ThreadPoolExecutor(max_workers=7) as executor:
        executor.map(lambda url: scrape_card(url, all_data), urls)
    
    with open("card_data.json", "w", encoding="utf-8") as json_file: #Website/data/
        json.dump(all_data, json_file, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
