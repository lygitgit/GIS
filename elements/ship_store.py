import math


class StorageShip:
    def __init__(self, name, vessage_info):
        self.name = name
        self.data_type = 'storage'
        self.position = [vessage_info['lat'][0], vessage_info['long'][0]]

        self.history_record_all = []
        self.detected_sign_all = []

        self.history_record = []
        self.detected_sign = []

        self.activate_sign = True
        self.state = 'unkown'
        self.orientation = 0

        for index, row in vessage_info.iterrows():
            date_str = row['datetime']
            # formatted_date_str = date_str.replace('/', '-')
            # self.history_record_all.append(([row['lat'], row['long']], formatted_date_str))

            self.history_record_all.append(([row['lat'], row['long']], row['datetime']))
            self.detected_sign_all.append(int(1))

    def update_state(self, time_start=None, time_end=None):

        print()

        self.history_record = [self.history_record_all[i]
                               for i, record in enumerate(self.history_record_all)
                               if record[1] < time_end and record[1] > time_start]
        self.detected_sign = [1] * len(self.history_record)
        if(len(self.history_record) > 1):
            self.orientation = math.degrees(math.atan2(
                self.history_record[-1][0][1] - self.history_record[-2][0][1],
                self.history_record[-1][0][0] - self.history_record[-2][0][0]
            ))
            target_orientation = math.degrees(math.atan2(115.85 - self.position[1], 9.75 - self.position[0]))
            if(abs(target_orientation - self.orientation) < 60):
                self.state = "protection"
            else:
                self.state = "unkown"

        if self.history_record != []:
            self.position = self.history_record[-1][0]

    def get_history(self):
        return self.history_record

    def get_detected_sign(self):
        return self.detected_sign
