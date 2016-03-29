from tkinter import *

from server.pmreader import *


class DisplayApp:
    def __init__(self):
        self.sensor = PMReader("COM4")
        self.top = Tk()
        self.top.title("Meritve delcev")
        self._place_components()
        #self.top.eval('tk::PlaceWindow %s center' % self.top.winfo_pathname(self.top.winfo_id()))

    def _place_components(self):
        lbl1 = Label(self.top, text="Trenutne meritve PM delcev v zraku:", fg="blue")
        lbl1.pack()

        data_lbl = Label(self.top)
        data_lbl.pack()
        self._setupRefresher(data_lbl)

    def _setupRefresher(self, label):
        def refresh():
            pm_25, pm_10 = self.sensor.readValues()
            if pm_10 != None:
                label.config(text="PM2.5 vrednost: {} μg/m^3, PM10 vrednost: {} μg/m^3".format(pm_25, pm_10))
                label.after(1000, refresh)

        refresh()

    def run(self):
        self.top.mainloop()

if __name__ == "__main__":
    app = DisplayApp()

    app.run()
