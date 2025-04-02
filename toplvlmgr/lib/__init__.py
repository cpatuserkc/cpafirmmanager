print(f"\n __init__.py: {__file__} with nam {__name__}")
import os
from abc imoprts import ABC,abstractmethod,ABCMeta
from dataclasses import Dataclass,field
from typing import List,Dict,Any
from collections import ChainMap,OrderedDict,Counter

class Keyword(metaclass=ABCMeta):
  
    @abstractmethod
    def foo(self):
        pass  
    @abstractmethod
    def foo(self):
        pass


class (metaclass=ABCMeta):

    @abstractmethod
    def foo(self):
        pass  
    @abstractmethod
    def foo(self):
        pass


class FamilyTree:
  
    def __init__(self, name, parent=None):
        self.name = name
        self.parent = parent
        self.children = []
      
