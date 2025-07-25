import os
import pathlib
import environ
import sys
import logging
import subprocess
import inspect
import requests

THIS_FILE = os.path.abspath(__file__)
THIS_DIR = os.path.dirname(THIS_FILE)
THIS_DIR_PARENT = os.path.dirname(THIS_DIR)
THIS_DIR_GRANDPA = os.path.dirname(THIS_DIR_PARENT)
THIS_DIR_GREAT_GRANDPA = os.path.dirname(THIS_DIR_GRANDPA)


class PathFamily:

  def __init__(self, this_file: str = __file__):
    self.this_file = this_file

  @property
  def parents(self):

    def ct_from_top(path):
      return len(pathlib.Path(path).parts)

    def get_parent(path):
      print("get_parent", path, ct_from_top(path))
      return os.path.dirname(path), ct_from_top
    
    while True:
      yield get_parent(self.this_file)
