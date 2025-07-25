import os
import pathlib

import sys
import logging
import subprocess
import inspect
# importing os module for environment variables
import os
# importing necessary functions from dotenv library
from dotenv import load_dotenv, dotenv_values
# loading variables from .env file
load_dotenv()

# accessing and printing value
print(os.getenv("MY_KEY"))

PATH_MAP = {}
from abc import ABC, abstractmethod


class Component(ABC):

  @abstractmethod
  def get_child_items(self, path: str):
    pass

  @abstractmethod
  def get_parent(self, path: str):
    pass


class Folder(ABC):

  def get_child_items(self, path: str):
    pass

  def get_parent(self, path: str):
    pass


class Drive(Component):

  @classmethod
  def get_child_items(cls, path: str):
    return os.listdir(path)

  def __init__(self, ltr: str, *args, **kwargs):
    self.ltr = ltr
    self.toplvl_items = self.get_child_items(self.ltr)
    print(f"\n drive {self.ltr} toplvl_items {self.toplvl_items}")
    self.grid = {}

  def get_child_items(self, path: str):
    pass

  def get_parent(self, path: str):
    pass

  def add_folder(self, name: str, row: int = 1):
    print(f"\n add_folder {name} row {row}")
    self.child_items.append(child)

  def remove_child(self, child):
    pass


class Device:

  @staticmethod
  def get_host_info():
    import socket
    hostname = socket.gethostname()
    print("hostname", hostname)
    return {"host_name": hostname, "host_addr": socket.gethostbyname(hostname)}

  def __init__(self, name: str, address: str, toplvl: str = None):
    self.name = name
    self.address = address
    self.drives = []
    self.path_map = {}
    self.paths = []

  def _get_init_clstype(self, ltr: str = "C", component: Component = Drive):
    return component(ltr)

  def add_drive(self, ltr: str = "C"):
    component = self._get_init_clstype(ltr=ltr)
    print(component)
    self.drives.append(component)
    return component

  def evaluate_path(self, path: str):
    print("evaluate_path", path)

    parts = pathlib.Path(path).parts
    print("parts", parts)
    parents = [str(part) for part in pathlib.Path(path).parents]
    print("parents", parents)
    base_name = parts[-1]
    print("base_name", base_name)
    path_dict = {"base_name": base_name, "parts": parts, "parents": parents}
    self.paths.append(path_dict)


def run_loop(path: str = None):
  path = path if path else os.path.dirname(os.path.abspath(__file__))
  print("run loop at start_dir", path)

  def ct_from_top(path):
    return len(pathlib.Path(path).parts)

  def roadmap(idx: int, path: str, parents: list[str], parts: list[str]):
    print("roadmap", path, parents, parts)
    import socket
    hostname = socket.gethostname()
    PATH_MAP[idx] = {
        "idx": idx,
        "name": parts[-1],
        "path": path,
        "parents": parents,
        "parts": parts
    }

  def get_parent(path, ct: int = 0):
    print("get_parent", path, ct)
    parents = [str(part) for part in pathlib.Path(path).parents]
    print("parents", len(parents))
    mapper = roadmap(path, parents,
                     [part[0] for part in pathlib.Path(path).parts])
    print("mapper", mapper)
    return os.path.dirname(path), ct_from_top(path)

  print(f"\n run loop at start_dir {path}")
  ct = ct_from_top(path)
  print(f"ct_from_top {ct}")
  current_gt_top = ct > 1

  def check_current_gt_top(ct: int = ct) -> bool:
    print(f"\n check_current_gt_top {ct}")
    if ct > 1:
      return True
    print(f"\n ct NOT gt 1 {ct}")
    return False

  print(f"current_gt_top {current_gt_top}")
  while current_gt_top:
    print(f"\n run loop current_gt_top {current_gt_top}")
    current_gt_top = check_current_gt_top(ct)
    path, ct = get_parent(path, ct)
    print(f"path {path} ct {ct}")
    if not current_gt_top:
      print(f"\n loop {current_gt_top} should end here\n {path} {ct}")
      break
    path, ct = get_parent(path, ct)
    print(f"\n loop still going ..")
    print(f"path {path} ct {ct}")
    #yield get_parent(path)
  print(f"\n loop ended...")


if __name__ == "__main__":
  run_loop()
