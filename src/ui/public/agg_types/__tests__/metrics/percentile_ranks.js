import expect from 'expect.js';
import ngMock from 'ng_mock';
import AggTypeMetricPercentileRanksProvider from 'ui/agg_types/metrics/percentile_ranks';
import VisProvider from 'ui/vis';
import FixturesStubbedLogstashIndexPatternProvider from 'fixtures/stubbed_logstash_index_pattern';
import MockState from 'fixtures/mock_state';

describe('AggTypeMetricPercentileRanksProvider class', function () {

  let Vis;
  let indexPattern;
  let aggTypeMetricPercentileRanks;

  beforeEach(ngMock.module('kibana', $provide => {
    $provide.service('kibiState', function () {
      return new MockState({ filters: [] });
    });
  }));
  beforeEach(ngMock.inject(function (Private) {
    Vis = Private(VisProvider);
    indexPattern = Private(FixturesStubbedLogstashIndexPatternProvider);
    aggTypeMetricPercentileRanks = Private(AggTypeMetricPercentileRanksProvider);
  }));

  it('uses the custom label if it is set', function () {
    const vis = new Vis(indexPattern, {});

    // Grab the aggConfig off the vis (we don't actually use the vis for
    // anything else)
    const aggConfig = vis.aggs[0];
    aggConfig.params.customLabel = 'my custom field label';
    aggConfig.params.values = [ 5000, 10000 ];
    aggConfig.params.field = {
      displayName: 'bytes'
    };

    const responseAggs = aggTypeMetricPercentileRanks.getResponseAggs(aggConfig);
    const percentileRankLabelFor5kBytes = responseAggs[0].makeLabel();
    const percentileRankLabelFor10kBytes = responseAggs[1].makeLabel();

    expect(percentileRankLabelFor5kBytes).to.be('Percentile rank 5,000 of "my custom field label"');
    expect(percentileRankLabelFor10kBytes).to.be('Percentile rank 10,000 of "my custom field label"');
  });

});
