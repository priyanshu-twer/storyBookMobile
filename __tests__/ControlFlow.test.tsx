import React from 'react';
import { View, Text, Image } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { Choose, When, Otherwise, If } from '../components/ControlFlow';

// 1. StatusTracker component
const StatusTrackerStep = ({ title, subTitle, status, isLast }) => (
  <View testID="TrackerStep">
    <Choose>
      <When condition={status === 'success'}>
        <Text testID="status-success">Completed</Text>
      </When>
      <When condition={status === 'failed'}>
        <Text testID="status-failed">Failed</Text>
      </When>
      <Otherwise>
        <Text testID="status-pending">Pending</Text>
      </Otherwise>
    </Choose>
    <View testID="TextWrapper">
      <If condition={title}>
        <Text>{title}</Text>
      </If>
      <If condition={subTitle}>
        <Text>{subTitle}</Text>
      </If>
    </View>
  </View>
);

const StatusTracker = ({ data = [] }) => (
  <View testID="StatusTracker">
    {data.map((item, index) => (
      <StatusTrackerStep
        key={item.id}
        title={item.title}
        subTitle={item.subTitle}
        status={item.status}
        isLast={index === data.length - 1}
      />
    ))}
  </View>
);

// 2. Step component
const Step = ({ item, isConnected, isVertical, StepNumber, currentStep }) => (
  <View testID="step-container">
    <View testID="image-container" />
    <View>
      <Choose>
        <When condition={StepNumber === 1}>
          <Text>Label 1</Text>
        </When>
        <When condition={StepNumber === 2}>
          <Text>Label 2</Text>
        </When>
        <Otherwise>
          <Text>Default Label</Text>
        </Otherwise>
      </Choose>
    </View>
  </View>
);

// 3. Avatar component
const Avatar = ({ imageSource, accessibilityText, children, currencyCode, initial, textFontSize, bold }) => {
  const [imgLoadError] = React.useState(false);

  return (
    <View testID="Avatar" accessibilityLabel={accessibilityText}>
      <Choose>
        <When condition={imageSource && !imgLoadError}>
          <Image source={{ uri: imageSource }} accessibilityLabel={accessibilityText} testID="image" />
        </When>
        <When condition={children}>{children}</When>
        <When condition={currencyCode}>
          <Text style={{ fontSize: textFontSize, fontWeight: bold ? 'bold' : 'normal' }}>
            {currencyCode}
          </Text>
        </When>
        <Otherwise>
          <If condition={initial}>
            <Text style={{ fontSize: textFontSize, fontWeight: bold ? 'bold' : 'normal' }}>
              {initial?.slice(0, 2)}
            </Text>
          </If>
        </Otherwise>
      </Choose>
    </View>
  );
};

describe('JSX Control Flow Tests', () => {
  test('StatusTracker renders default props with snapshot match', () => {
    const data1 = [
      { id: '1', title: 'Order Placed', subTitle: '24 Jan 19, 13:52', status: 'success' },
      { id: '2', title: 'Processing', subTitle: '25 Jan 19, 11:22', status: 'pending' },
    ];
    let renderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<StatusTracker data={data1} />);
    });
    const tree = renderer.toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('Step component renders correct label based on StepNumber', () => {
    const data2 = [{}, { name: 'Step 2' }];
    let renderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <Step item={data2[1]} isConnected isVertical StepNumber={2} currentStep={1} />
      );
    });
    const tree = renderer.toJSON();
    const stringified = JSON.stringify(tree);
    expect(stringified).toContain('Label 2');
    expect(tree).toMatchSnapshot();
  });

  test('Avatar renders image when imageSource provided', () => {
    let renderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <Avatar accessibilityText="size-JUMBO" imageSource="https://example.com/avatar.png" />
      );
    });
    const tree = renderer.toJSON();
    const stringified = JSON.stringify(tree);
    expect(stringified).toContain('size-JUMBO');
    expect(tree).toMatchSnapshot();
  });

  test('Avatar renders initial text when initial provided', () => {
    let renderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <Avatar initial="AB" textFontSize={14} bold />
      );
    });
    const tree = renderer.toJSON();
    const stringified = JSON.stringify(tree);
    expect(stringified).toContain('AB');
    expect(tree).toMatchSnapshot();
  });
});
