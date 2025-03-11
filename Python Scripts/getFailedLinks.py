import re

def extract_failed_links(input_file, output_file):
    failed_links = []

    with open(input_file, 'r', encoding='utf-8') as file:
        for line in file:
            if "Error scraping" in line:
                # Extract the URL using regex for better accuracy
                match = re.search(r'Error scraping (https://[\w./]+)', line)
                if match:
                    failed_links.append(match.group(1))

    # Save the failed links to the output file
    with open(output_file, 'w', encoding='utf-8') as file:
        file.write("\n".join(failed_links))

    print(f"Extracted {len(failed_links)} failed links to {output_file}")

# Usage example
extract_failed_links('scrape_log.txt', 'failed_card_links.txt')