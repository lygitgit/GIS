import pandas as pd

start_datetime = pd.Timestamp('2019-06-01 00:00')
end_datetime = pd.Timestamp('2019-8-09 23:59')
total_hours = (end_datetime - start_datetime).total_seconds() / 3600  # 转换为小时
samples_num = 500
time_step = total_hours / (samples_num - 1)
def get_time_from_index(index: int) -> str:
    time = start_datetime + pd.Timedelta(hours=time_step * index)
    return time.strftime('%Y-%m-%d %H:%M')
