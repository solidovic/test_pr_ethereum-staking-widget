import React, { FC } from 'react';

import { FaqAccordion } from '@lidofinance/ui-faq';

import { Section } from 'shared/components';
import { useUpdatableFaq } from 'shared/hooks/use-faq-on-client';
import { faqAccordionOnLinkClick } from 'utils/faq-matomo';
import { FaqWithMeta } from 'utils/faq';

type ClaimFaqProps = {
  faqWithMeta: FaqWithMeta;
};

export const ClaimFaq: FC<ClaimFaqProps> = ({ faqWithMeta }) => {
  const { data: pageFAQ } = useUpdatableFaq(faqWithMeta);
  if (!pageFAQ) return null;

  return (
    <>
      <Section title="FAQ">
        <FaqAccordion
          faqList={pageFAQ.faq}
          onLinkClick={(props) => {
            faqAccordionOnLinkClick({
              pageId: pageFAQ.pageIdentification,
              ...props,
            });
          }}
        />
      </Section>
    </>
  );
};
