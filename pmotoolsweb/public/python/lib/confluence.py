__author__ = 'asia'

import xmlrpc.client

class Confluence (object):

    def __init__(self, url, username, password, spacekey):
        self.server = xmlrpc.client.ServerProxy(url)
        self.token = self.server.confluence2.login(username, password)
        self.spacekey = spacekey

    def get_page(self, title):
        page = None

        try:
            page = self.server.confluence2.getPage(self.token, self.spacekey, title)
        except:
            return None

        return page

    def get_page_by_id(self, page_id):
        page = None

        try:
            page = self.server.confluence2.getPage(self.token, page_id)
        except:
            return None

        return page

    def get_or_create_page(self, title, parent_id, content):
        page_id = None

        try:
            page_id = self.server.confluence2.getPage(self.token, self.spacekey, title)
        except:
            if self.create_page(title, parent_id, content) is not None:
                page_id = self.server.confluence2.getPage(self.token, self.spacekey, title)

        return page_id

    def update_or_create_page(self, title, parent_id, content):
        page_id = None

        try:
            page_id = self.server.confluence2.getPage(self.token, self.spacekey, title)
        except:
            if self.create_page(title, parent_id, content) is not None:
                page_id = self.server.confluence2.getPage(self.token, self.spacekey, title)
                return page_id
        try:
            if self.create_page(title, parent_id, content, page_id) is not None:
                return page_id
        except:
            #print(msg)
            pass
        return page_id

    def create_page(self, title, parent_id, content, page_id=None):
        new_page = None
        page = {
                "space": self.spacekey,
                "parentId": parent_id,
                "title": title,
                "content": content,
                }
        if page_id is not None:
            page = {
                    "id": page_id["id"],
                    "space": self.spacekey,
                    "parentId": parent_id,
                    "title": title,
                    "content": content,
                    "version": page_id["version"],
                    }
        try:
            new_page = self.server.confluence2.storePage(self.token, page)
        except Exception as msg:
            print(msg)

        return new_page

    def get_child_pages(self, parent_page):
        children = []
        if parent_page is not None:
            try:
                children = self.server.confluence2.getChildren(self.token, parent_page["id"])
            except Exception as msg:
                print(msg)
        return children


