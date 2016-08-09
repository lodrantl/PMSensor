from tkinter import *

from .pmreader import *


class DisplayApp:
    def __init__(self):
        self.sensor = PMReader("COM3", self.refresh)
        self.top = Tk()
        self.top.title("Meritve delcev")
        self._place_components()
        #self.top.eval('tk::PlaceWindow %s center' % self.top.winfo_pathname(self.top.winfo_id()))

    def _place_components(self):
        lbl1 = Label(self.top, text="Trenutne meritve PM delcev v zraku:", fg="blue")
        lbl1.pack()

        self.data_lbl = Label(self.top)
        self.data_lbl.pack()

    def refresh(self, data):
        print("ss")
        pm_25, pm_10 = data
        if pm_10 != None:
            self.data_lbl.config(text="PM2.5 vrednost: {} μg/m^3, PM10 vrednost: {} μg/m^3".format(pm_25, pm_10))

    def run(self):
        self.top.mainloop()

if __name__ == "__main__":
    app = DisplayApp()

    app.run()
