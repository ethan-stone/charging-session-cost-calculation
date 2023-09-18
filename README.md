# Description

This repo is an attempt to implement OCPITarriff pricing calculation

# Approach

The implementation can be found in `packages/functions/src/cost-calculator`

The general idea is as follows:

Given a Session, EnergyReadings, and ConnectorStatusEvents, we can find a collection of SessionIntervals. There are two types of intervals, "charging" and "idle".

An interval contains a start time and an end time as well as a start energy and end energy. The time between start time and end time can be anything from a few seconds to a few hours. The energy between start energy and end energy can be anything from a few kWh to a few MWh. To get precision we interpolate energy readings per second.

For example is we have a session interval with a start time of 0 seconds and an end time of 5 seconds, with a start energy of 0kWh and end energy of 5kWh, we would interpolate 5 energy readings, one for each second.

The first would have a start time of 0 seconds and end time of 1 second with a start energy of 0kWh and an end energy of 1kWh. The second would have a start time of 1 second and end time of 2 seconds with a start energy of 1kWh and an end energy of 2kWh. And so on.

After generating all this interpolated intervals, we can then calculate the cost of each interval. To do this we have to find the pricing element in the Rate that applies for this interval based on the restrictions. To find the pricing element we loop through all the pricing elements and find the first element that passes the restrictions. Both the start of the interval and the end of the interval must be within the restrictions. If the start and end fall in different pricing elements then that interval will result in zero cost. This is why we interpolate the original intervals because it makes these smaller intervals that fall into different pricing elements negligable.

Once we have the pricing element, we can calculate the cost of the interval. A pricing element can contain 4 different dimensions of pricing. TIME, IDLE, ENERGY, and FLAT. The cost of each of these dimensions for the interval is calculated separately and then added together to get teh total cost of the interval.

Once the cost of all the intervals is calculated, we can sum them up to get the total cost of the session.
