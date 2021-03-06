import React, { useEffect, useCallback } from "react";
import _ from "lodash";
import moment from "moment-timezone";

import { useLocalStore, observer } from "mobx-react-lite";
import WorkedHoursService from "../../services/workedHours.service";
import { useAuthStore } from "../../stores/AuthStore";
import { Segment, Header, Input, Button, Icon, Menu } from "semantic-ui-react";
import WorkedHourItem from "./WorkedHourItem";
import MonthSelector from "../Common/MonthSelector";
import clientsService from "../../services/clients.service";

/**
 * Worked hour List Component
 * @param {Object} props
 */
export default observer((props) => {
  const authStore = useAuthStore();
  const initialDate = moment();
  const year = initialDate.year();
  const month = initialDate.month() + 1;
  const clientId = props.match.params.id;

  /**
   * Local store
   */
  const localStore = useLocalStore(() => ({
    clientName: props.location.state ? props.location.state.name : "",
    loading: false,
    list: {},
    year,
    month,
    get date() {
      return moment(
        `${localStore.year}-${localStore.month.toString().padStart(2, "0")}-01`
      );
    },
    get totalHours() {
      return _.round(
        _.reduce(this.list, (sum, n) => sum + parseFloat(n.hours) || 0, 0),
        2
      );
    },
    next: () => {
      const date = moment(
        `${localStore.year}-${localStore.month.toString().padStart(2, "0")}-01`
      );
      date.add(1, "months");
      localStore.year = date.year();
      localStore.month = date.month() + 1;
    },
    prev: () => {
      const date = moment(
        `${localStore.year}-${localStore.month.toString().padStart(2, "0")}-01`
      );
      date.subtract(1, "months");
      localStore.year = date.year();
      localStore.month = date.month() + 1;
    },
    setLoaading(value) {
      this.loading = value;
    },
    setMonth(value) {
      this.month = value;
    },
    setYear(value) {
      this.year = value;
    },
    setList(value) {
      this.list = value;
    },
    setItemError(item, value) {
      item.error = value;
    },
    setClientName(name) {
      this.clientName = name;
    },
    async setHour(item) {
      try {
        this.setItemError(this.list[item.day], false);
        this.list[item.day].hours = item.hours;
        await WorkedHoursService.setHour(
          props.match.params.userId || authStore.user._id,
          clientId,
          item.day,
          item.hours
        );
      } catch (error) {
        if (
          error.response &&
          error.response.data.status === 422 &&
          error.response.data
        ) {
          this.setItemError(
            this.list[item.day],
            error.response.data.errors[0].message
          );
        } else {
          this.setItemError(this.list[item.day], true);
        }
      }
    },
    async loadClient() {
      const client = await clientsService.get(clientId);
      if (client && client.data && client.data.data.name) {
        localStore.setClientName(client.data.data.name);
      }
    },
    async getList() {
      if (!localStore.clientName) {
        localStore.loadClient();
      }
      this.setLoaading(true);

      try {
        const response = await WorkedHoursService.getHours(
          props.match.params.userId || authStore.user._id,
          clientId,
          localStore.year,
          localStore.month
        );
        const result = {};
        const dayOffset = localStore.date.day();

        _.times(dayOffset, (i) => {
          const day = localStore.date
            .clone()
            .subtract(dayOffset - i, "days")
            .format();
          result[day] = {
            day,
            error: false,
          };
        });

        for (let i = 1; i <= localStore.date.daysInMonth(); i++) {
          const day = `${
            localStore.year
          }-${localStore.month
            .toString()
            .padStart(2, "0")}-${i.toString().padStart(2, "0")}T00:00:00.000Z`;
          if (!response.data.data[day]) {
            result[day] = {
              day,
              hours: 0,
              error: false,
            };
          } else {
            result[day] = response.data.data[day];
            result[day].error = false;
          }
        }

        this.setList(result);
      } catch (error) {
        console.log(error);
      } finally {
        this.setLoaading(false);
      }
    },
  }));

  /**
   * On month change
   */
  const onMonthChange = useCallback(
    (e, v) => {
      console.log(e, v);
      localStore.setMonth(v.value);
    },
    [localStore]
  );

  /**
   * On year change
   */
  const onYearChange = useCallback(
    (e, v) => {
      localStore.setYear(v.value);
      if (v.value > 2000) {
        localStore.getList();
      }
    },
    [localStore]
  );

  /**
   * Side effects
   */
  useEffect(() => {
    localStore.getList();
  }, [localStore, localStore.month]);

  const list = localStore.list;

  return (
    <div className="ui container aligned">
      <Header as="h3" icon="clock outline">
        {`${localStore.clientName}: Worked Hours of ${localStore.date.format(
          "MMMM"
        )} ${localStore.date.year()}`}
        <Header.Subheader>Total: {localStore.totalHours} hrs</Header.Subheader>
      </Header>
      <Menu borderless>
        <Menu.Item>
          <Button onClick={localStore.prev} animated>
            <Button.Content visible>Prev</Button.Content>
            <Button.Content hidden>
              <Icon name="arrow left" />
            </Button.Content>
          </Button>
        </Menu.Item>
        <Menu.Item fitted="vertically">
          <MonthSelector
            value={localStore.month}
            onChange={onMonthChange}
          />
        </Menu.Item>
        <Menu.Item>
          <Input
            value={localStore.year}
            type="number"
            label="Year"
            error={localStore.year < 2000}
            onChange={onYearChange}
          />
        </Menu.Item>
        <Menu.Item position="right">
          <Button onClick={localStore.next} animated>
            <Button.Content visible>Next</Button.Content>
            <Button.Content hidden>
              <Icon name="arrow right" />
            </Button.Content>
          </Button>
        </Menu.Item>
      </Menu>
      <Segment.Group>
        <Segment attached color="blue" loading={localStore.loading}>
          <div className="ui container center aligned">
            <div className="ui seven cards">
              {_.map(list, (whitem) => (
                <WorkedHourItem item={whitem} store={localStore} />
              ))}
            </div>
          </div>
        </Segment>
      </Segment.Group>
    </div>
  );
});
