from bs4 import BeautifulSoup

def get_start_stop(source, tag_name):
    soup = BeautifulSoup(source, 'html.parser')
    tag = soup.find(tag_name)
    if tag:
        start = source.find(f"<{tag_name}")
        end = source.find(">", start) + 1
        return start, end
    return None

# get_start_stop('hello<br    >there', 'br')
start, stop = get_start_stop('hello<br    >there', 'br')
print(start, stop)